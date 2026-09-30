import type { Cents, Group, Settlement } from '../types';
import { useGroups } from './GroupsContext';
import { createId } from '../lib/id';
import { confirmPayment, recordPayment, removePayment, reportPayment } from '../lib/payments';

/** Acciones sobre pagos de un grupo. El id se genera fuera de la transacción (reintentos seguros). */
export function usePaymentActions(group: Group) {
  const { updateGroup } = useGroups();
  const payment = (s: Settlement, amount: Cents) => ({ id: createId(), from: s.from, to: s.to, amount });
  const now = () => new Date().toISOString();

  return {
    /** Quien debe avisa que pagó (queda pendiente de confirmación). */
    report: (s: Settlement, amount: Cents) => {
      const p = payment(s, amount);
      const date = now();
      return updateGroup(group.id, (g) => reportPayment(g, p, date));
    },
    /** Quien cobra (o cualquiera, en modo sin identidad) registra un pago ya hecho. */
    record: (s: Settlement, amount: Cents) => {
      const p = payment(s, amount);
      const date = now();
      return updateGroup(group.id, (g) => recordPayment(g, p, date));
    },
    confirm: (paymentId: string) => updateGroup(group.id, (g) => confirmPayment(g, paymentId)),
    remove: (paymentId: string) => updateGroup(group.id, (g) => removePayment(g, paymentId)),
  };
}
