import type { Group, Payment } from '../types';

type NewPayment = Pick<Payment, 'id' | 'from' | 'to' | 'amount'>;

// Como con gastos e integrantes, el id viene generado de afuera: aplicar la
// misma operación dos veces (reintento de una transacción) no duplica nada.

function upsert(group: Group, payment: Payment): Group {
  const payments = group.payments ?? [];
  return payments.some((p) => p.id === payment.id)
    ? { ...group, payments: payments.map((p) => (p.id === payment.id ? payment : p)) }
    : { ...group, payments: [...payments, payment] };
}

/** Quien pagó avisa que transfirió. Queda pendiente hasta que quien cobra lo confirme. */
export function reportPayment(group: Group, payment: NewPayment, date = new Date().toISOString()): Group {
  return upsert(group, { ...payment, status: 'pending', date });
}

/** Quien cobra registra directamente que recibió el pago. */
export function recordPayment(group: Group, payment: NewPayment, date = new Date().toISOString()): Group {
  return upsert(group, { ...payment, status: 'confirmed', date });
}

/** Quien cobra confirma un aviso de pago: desde ahora cuenta en los balances. */
export function confirmPayment(group: Group, paymentId: string): Group {
  return {
    ...group,
    payments: (group.payments ?? []).map((p) => (p.id === paymentId ? { ...p, status: 'confirmed' } : p)),
  };
}

/** Deshacer un aviso, rechazarlo ("no lo recibí") o borrar un pago cargado por error. */
export function removePayment(group: Group, paymentId: string): Group {
  return { ...group, payments: (group.payments ?? []).filter((p) => p.id !== paymentId) };
}

/** Aviso pendiente de una transferencia puntual (de → a), si existe. */
export function findPendingPayment(group: Group, from: string, to: string): Payment | undefined {
  return (group.payments ?? []).find((p) => p.status === 'pending' && p.from === from && p.to === to);
}
