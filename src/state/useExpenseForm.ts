import { useMemo, useState } from 'react';
import type { Cents, Expense, ExpenseItem, ExpenseParticipant, Member } from '../types';
import { cleanItems, withItems } from '../lib/expenseItems';
import { calculateExpenseDistribution } from '../lib/distribution';
import { validateExpense, type ExpenseField, type FieldErrors } from '../lib/validation';
import type { ExpenseDraft } from '../lib/groupOperations';

/**
 * Estado del formulario de gasto.
 *
 * Sólo se guardan las decisiones del usuario: quiénes participan y qué montos
 * fijó a mano (isCustom). Los montos automáticos se derivan en cada render con
 * calculateExpenseDistribution, así nunca quedan desactualizados: cambiar el
 * total, agregar/quitar gente o fijar un monto recalcula el resto al instante.
 */
export function useExpenseForm(members: Member[], expense?: Expense) {
  const [description, setDescription] = useState(expense?.description ?? '');
  const [totalAmount, setTotalAmount] = useState<Cents | null>(expense?.totalAmount ?? null);
  const [paidBy, setPaidBy] = useState(expense?.paidBy ?? members[0]?.id ?? '');
  const [selection, setSelection] = useState<ExpenseParticipant[]>(
    () => expense?.participants ?? members.map((m) => ({ memberId: m.id, amount: 0, isCustom: false })),
  );

  const distribution = useMemo(
    () => calculateExpenseDistribution(totalAmount ?? 0, selection),
    [totalAmount, selection],
  );

  const errors: FieldErrors<ExpenseField> = validateExpense({
    description,
    totalAmount,
    paidBy,
    participants: distribution.participants,
    members,
  });

  /** Mantiene los participantes en el mismo orden que los integrantes del grupo. */
  const inMemberOrder = (list: ExpenseParticipant[]) => {
    const order = new Map(members.map((m, i) => [m.id, i]));
    return [...list].sort((a, b) => (order.get(a.memberId) ?? 0) - (order.get(b.memberId) ?? 0));
  };

  const toggleParticipant = (memberId: string) =>
    setSelection((prev) =>
      prev.some((p) => p.memberId === memberId)
        ? prev.filter((p) => p.memberId !== memberId)
        : inMemberOrder([...prev, { memberId, amount: 0, isCustom: false }]),
    );

  const selectAll = () =>
    setSelection((prev) =>
      inMemberOrder([
        ...prev,
        ...members
          .filter((m) => !prev.some((p) => p.memberId === m.id))
          .map((m) => ({ memberId: m.id, amount: 0, isCustom: false })),
      ]),
    );

  /** El usuario escribió un monto: queda bloqueado como personalizado. */
  const setCustomAmount = (memberId: string, amount: Cents | null) =>
    setSelection((prev) =>
      prev.map((p) => (p.memberId === memberId ? { ...p, amount: amount ?? 0, isCustom: true } : p)),
    );

  /** Vuelve un monto personalizado a automático (y descarta su detalle, si tenía). */
  const unlockAmount = (memberId: string) =>
    setSelection((prev) => prev.map((p) => (p.memberId === memberId ? withItems(p, []) : p)));

  /** Detalle opcional de lo que consumió una persona: su monto pasa a ser la suma. */
  const setItems = (memberId: string, items: ExpenseItem[]) =>
    setSelection((prev) => prev.map((p) => (p.memberId === memberId ? withItems(p, items) : p)));

  const resetEqualSplit = () => setSelection((prev) => prev.map((p) => withItems(p, [])));

  const toDraft = (): ExpenseDraft => ({
    description: description.trim(),
    totalAmount: totalAmount ?? 0,
    paidBy,
    participants: distribution.participants.map(cleanItems),
  });

  return {
    description,
    setDescription,
    totalAmount,
    setTotalAmount,
    paidBy,
    setPaidBy,
    distribution,
    errors,
    hasCustomAmounts: selection.some((p) => p.isCustom),
    toggleParticipant,
    selectAll,
    setCustomAmount,
    unlockAmount,
    setItems,
    resetEqualSplit,
    toDraft,
  };
}
