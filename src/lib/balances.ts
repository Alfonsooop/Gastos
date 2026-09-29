import type { Cents, Expense, Member, MemberBalance, Settlement } from '../types';

export function calculateGroupTotal(expenses: Expense[]): Cents {
  return expenses.reduce((sum, e) => sum + e.totalAmount, 0);
}

/**
 * Para cada integrante: cuánto pagó, cuánto le correspondía y su balance
 * (pagado - le corresponde). La suma de todos los balances es siempre 0.
 */
export function calculateBalances(members: Member[], expenses: Expense[]): MemberBalance[] {
  const paid = new Map<string, Cents>();
  const owed = new Map<string, Cents>();

  for (const expense of expenses) {
    paid.set(expense.paidBy, (paid.get(expense.paidBy) ?? 0) + expense.totalAmount);
    for (const p of expense.participants) {
      owed.set(p.memberId, (owed.get(p.memberId) ?? 0) + p.amount);
    }
  }

  return members.map((m) => {
    const memberPaid = paid.get(m.id) ?? 0;
    const memberOwed = owed.get(m.id) ?? 0;
    return { memberId: m.id, paid: memberPaid, owed: memberOwed, balance: memberPaid - memberOwed };
  });
}

interface Position {
  memberId: string;
  amount: Cents; // siempre positivo
  order: number; // orden original, para desempatar de forma determinista
}

const byAmountDesc = (a: Position, b: Position) => b.amount - a.amount || a.order - b.order;

/**
 * Genera las transferencias para dejar a todos en $0, intentando minimizar la
 * cantidad de transferencias:
 *
 * 1. Primero empareja deudores y acreedores con exactamente el mismo importe
 *    (se resuelven con una sola transferencia).
 * 2. Después, de forma greedy, el que más debe le paga al que más tiene que
 *    recibir, por el mínimo entre ambos importes, hasta saldar todo.
 */
export function calculateSettlements(balances: MemberBalance[]): Settlement[] {
  const debtors: Position[] = [];
  const creditors: Position[] = [];
  balances.forEach((b, order) => {
    if (b.balance < 0) debtors.push({ memberId: b.memberId, amount: -b.balance, order });
    else if (b.balance > 0) creditors.push({ memberId: b.memberId, amount: b.balance, order });
  });

  const settlements: Settlement[] = [];

  // 1. Coincidencias exactas.
  for (const debtor of [...debtors].sort(byAmountDesc)) {
    const match = creditors
      .filter((c) => c.amount > 0)
      .sort(byAmountDesc)
      .find((c) => c.amount === debtor.amount);
    if (match) {
      settlements.push({ from: debtor.memberId, to: match.memberId, amount: debtor.amount });
      match.amount = 0;
      debtor.amount = 0;
    }
  }

  // 2. Greedy: mayor deudor contra mayor acreedor.
  for (;;) {
    const debtor = debtors.filter((d) => d.amount > 0).sort(byAmountDesc)[0];
    const creditor = creditors.filter((c) => c.amount > 0).sort(byAmountDesc)[0];
    if (!debtor || !creditor) break;
    const amount = Math.min(debtor.amount, creditor.amount);
    settlements.push({ from: debtor.memberId, to: creditor.memberId, amount });
    debtor.amount -= amount;
    creditor.amount -= amount;
  }

  // Orden de lectura amigable: agrupado por quien paga, en el orden del grupo.
  const order = new Map(balances.map((b, i) => [b.memberId, i]));
  return settlements.sort(
    (a, b) => (order.get(a.from) ?? 0) - (order.get(b.from) ?? 0) || (order.get(a.to) ?? 0) - (order.get(b.to) ?? 0),
  );
}

/** Aplica transferencias a los balances (útil para verificar que todo queda en 0). */
export function applySettlements(balances: MemberBalance[], settlements: Settlement[]): Map<string, Cents> {
  const result = new Map(balances.map((b) => [b.memberId, b.balance]));
  for (const s of settlements) {
    result.set(s.from, (result.get(s.from) ?? 0) + s.amount);
    result.set(s.to, (result.get(s.to) ?? 0) - s.amount);
  }
  return result;
}
