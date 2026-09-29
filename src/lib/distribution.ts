import type { Cents, ExpenseParticipant } from '../types';

/**
 * Participante tal como lo maneja el formulario: si isCustom es true, `amount`
 * es el valor bloqueado que escribió el usuario; si es false, `amount` se ignora
 * y se recalcula automáticamente.
 */
export type ParticipantInput = ExpenseParticipant;

export type DistributionIssue =
  | { type: 'no-participants' }
  /** Los montos personalizados solos ya superan el total. */
  | { type: 'custom-exceeds-total'; excess: Cents }
  /** Todos los montos son personalizados y no llegan al total. */
  | { type: 'unassigned'; missing: Cents };

export interface DistributionResult {
  participants: ExpenseParticipant[];
  totalAssigned: Cents;
  /** total - asignado. 0 cuando la distribución es válida. */
  difference: Cents;
  issue: DistributionIssue | null;
}

/**
 * Divide `amount` centavos entre `count` personas.
 *
 * Cada persona recibe el importe redondeado al centavo más cercano y los centavos
 * que sobran o faltan se ajustan, de a uno, en los últimos participantes. Así:
 *   $100 / 3    → 33,33 · 33,33 · 33,34
 *   $20.000 / 3 → 6.666,67 · 6.666,67 · 6.666,66
 * La suma siempre es exactamente `amount` y ninguna parte difiere en más de 1 centavo.
 */
export function splitEvenly(amount: Cents, count: number): Cents[] {
  if (count <= 0) return [];
  if (amount <= 0) return Array.from({ length: count }, () => 0);

  const base = Math.floor(amount / count);
  const remainder = amount % count;
  const roundUp = remainder * 2 >= count; // ¿el cociente redondea hacia arriba?
  const perPerson = roundUp ? base + 1 : base;
  const shares = Array.from({ length: count }, () => perPerson);

  // Diferencia a corregir (positiva: faltan centavos; negativa: sobran).
  let adjustment = amount - perPerson * count;
  for (let i = count - 1; adjustment !== 0 && i >= 0; i--) {
    const step = adjustment > 0 ? 1 : -1;
    shares[i] = (shares[i] ?? 0) + step;
    adjustment -= step;
  }
  return shares;
}

export function calculateTotalAssigned(participants: Pick<ExpenseParticipant, 'amount'>[]): Cents {
  return participants.reduce((sum, p) => sum + p.amount, 0);
}

/**
 * Calcula cuánto le corresponde a cada participante.
 *
 * 1. Los montos personalizados (isCustom) se respetan tal cual.
 * 2. Lo que queda (total - personalizados) se divide en partes iguales entre
 *    los participantes automáticos, resolviendo los centavos con splitEvenly.
 * 3. Si los personalizados superan el total NO se tocan: se devuelve el error
 *    y los automáticos quedan en 0 para que el usuario corrija.
 */
export function calculateExpenseDistribution(
  totalAmount: Cents,
  participants: ParticipantInput[],
): DistributionResult {
  if (participants.length === 0) {
    return { participants: [], totalAssigned: 0, difference: totalAmount, issue: { type: 'no-participants' } };
  }

  const customTotal = calculateTotalAssigned(participants.filter((p) => p.isCustom));
  const automatic = participants.filter((p) => !p.isCustom);
  const available = totalAmount - customTotal;

  const autoShares = splitEvenly(Math.max(available, 0), automatic.length);
  let autoIndex = 0;
  const result: ExpenseParticipant[] = participants.map((p) =>
    p.isCustom
      ? { ...p, isCustom: true }
      : { memberId: p.memberId, amount: autoShares[autoIndex++] ?? 0, isCustom: false },
  );

  const totalAssigned = calculateTotalAssigned(result);
  const difference = totalAmount - totalAssigned;

  let issue: DistributionIssue | null = null;
  if (available < 0) issue = { type: 'custom-exceeds-total', excess: -available };
  else if (difference > 0) issue = { type: 'unassigned', missing: difference };

  return { participants: result, totalAssigned, difference, issue };
}

/** Descarta los montos personalizados y vuelve a dividir en partes iguales. */
export function resetToEqualSplit(totalAmount: Cents, memberIds: string[]): ExpenseParticipant[] {
  return calculateExpenseDistribution(
    totalAmount,
    memberIds.map((memberId) => ({ memberId, amount: 0, isCustom: false })),
  ).participants;
}
