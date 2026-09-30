import { describe, expect, it } from 'vitest';
import { addExpense, createGroup } from './groupOperations';
import { resetToEqualSplit } from './distribution';
import { calculateBalances, calculateSettlements } from './balances';
import { confirmPayment, findPendingPayment, recordPayment, removePayment, reportPayment } from './payments';
import { pesos } from './money';

function setup() {
  let group = createGroup({ name: 'Salida', description: '', memberNames: ['Alfonso', 'Juan', 'Pedro'] });
  const [a, j, p] = group.members.map((m) => m.id) as [string, string, string];
  group = addExpense(group, {
    description: 'Bar',
    totalAmount: pesos(30000),
    paidBy: a,
    participants: resetToEqualSplit(pesos(30000), [a, j, p]),
  });
  const balancesOf = (g: typeof group) => calculateBalances(g.members, g.expenses, g.payments);
  return { group, a, j, p, balancesOf };
}

describe('pagos entre integrantes', () => {
  it('un aviso pendiente no cambia los balances', () => {
    const { group, a, j, balancesOf } = setup();
    const before = balancesOf(group).map((b) => b.balance);
    const reported = reportPayment(group, { id: 'p1', from: j, to: a, amount: pesos(10000) });
    expect(balancesOf(reported).map((b) => b.balance)).toEqual(before);
    expect(findPendingPayment(reported, j, a)?.id).toBe('p1');
  });

  it('al confirmarlo, Juan queda saldado y Alfonso tiene menos por cobrar', () => {
    const { group, a, j, balancesOf } = setup();
    const confirmed = confirmPayment(reportPayment(group, { id: 'p1', from: j, to: a, amount: pesos(10000) }), 'p1');
    const [alfonso, juan, pedro] = balancesOf(confirmed);
    expect(juan).toMatchObject({ sent: pesos(10000), balance: 0 });
    expect(alfonso).toMatchObject({ received: pesos(10000), balance: pesos(10000) });
    expect(pedro?.balance).toBe(pesos(-10000));
    expect(calculateSettlements(balancesOf(confirmed))).toEqual([{ from: expect.any(String), to: a, amount: pesos(10000) }]);
    expect(findPendingPayment(confirmed, j, a)).toBeUndefined();
  });

  it('cuando todos pagan, no quedan transferencias', () => {
    const { group, a, j, p, balancesOf } = setup();
    let g = recordPayment(group, { id: 'p1', from: j, to: a, amount: pesos(10000) });
    g = recordPayment(g, { id: 'p2', from: p, to: a, amount: pesos(10000) });
    expect(calculateSettlements(balancesOf(g))).toEqual([]);
    expect(balancesOf(g).reduce((s, b) => s + b.balance, 0)).toBe(0);
  });

  it('un pago parcial reduce la deuda', () => {
    const { group, a, j, balancesOf } = setup();
    const g = recordPayment(group, { id: 'p1', from: j, to: a, amount: pesos(4000) });
    const juan = balancesOf(g).find((b) => b.memberId === j);
    expect(juan?.balance).toBe(pesos(-6000));
  });

  it('rechazar o deshacer borra el pago', () => {
    const { group, a, j, balancesOf } = setup();
    const g = removePayment(recordPayment(group, { id: 'p1', from: j, to: a, amount: pesos(10000) }), 'p1');
    expect(g.payments).toEqual([]);
    expect(balancesOf(g)).toEqual(balancesOf(group));
  });

  it('aplicar dos veces la misma operación no duplica el pago', () => {
    const { group, a, j } = setup();
    const pay = { id: 'p1', from: j, to: a, amount: pesos(10000) };
    const twice = recordPayment(recordPayment(group, pay, 'd'), pay, 'd');
    expect(twice.payments).toHaveLength(1);
  });
});
