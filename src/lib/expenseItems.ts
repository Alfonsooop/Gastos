import type { Cents, ExpenseItem, ExpenseParticipant } from '../types';
import { createId } from './id';

export function sumItems(items: Pick<ExpenseItem, 'amount'>[]): Cents {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Reemplaza el detalle de una persona. Con ítems, su monto pasa a ser la suma
 * y queda personalizado; sin ítems, vuelve a ser automático.
 */
export function withItems(participant: ExpenseParticipant, items: ExpenseItem[]): ExpenseParticipant {
  if (items.length === 0) return { memberId: participant.memberId, amount: 0, isCustom: false };
  return { memberId: participant.memberId, amount: sumItems(items), isCustom: true, items };
}

/**
 * Primer ítem al abrir el detalle: si la persona ya tenía un monto escrito a
 * mano, arranca con ese monto para no perderlo.
 */
export function firstItem(participant: ExpenseParticipant): ExpenseItem {
  return {
    id: createId(),
    description: '',
    amount: participant.isCustom && !participant.items?.length ? participant.amount : 0,
  };
}

/** Limpia el detalle antes de guardar: saca renglones vacíos y espacios de más. */
export function cleanItems(participant: ExpenseParticipant): ExpenseParticipant {
  if (!participant.items) return participant;
  const items = participant.items
    .map((item) => ({ ...item, description: item.description.trim() }))
    .filter((item) => item.description !== '' || item.amount !== 0);
  if (items.length === 0) {
    const { items: _removed, ...rest } = participant;
    return rest;
  }
  return { ...participant, items };
}
