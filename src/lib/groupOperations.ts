import type { Expense, Group, Member } from '../types';
import { calculateExpenseDistribution, resetToEqualSplit } from './distribution';
import { createId } from './id';

export interface GroupDraft {
  name: string;
  description: string;
  memberNames: string[];
}

export type ExpenseDraft = Omit<Expense, 'id' | 'date'>;

export function createGroup(draft: GroupDraft): Group {
  return {
    id: createId(),
    name: draft.name.trim(),
    description: draft.description.trim(),
    members: draft.memberNames
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ id: createId(), name })),
    expenses: [],
    createdAt: new Date().toISOString(),
  };
}

export function addMember(group: Group, name: string): Group {
  const member: Member = { id: createId(), name: name.trim() };
  return { ...group, members: [...group.members, member] };
}

export interface MemberUsage {
  paidCount: number;
  participatesCount: number;
  /** Gastos donde es el único participante (se eliminarían al quitarlo). */
  soleParticipantCount: number;
}

export function getMemberUsage(group: Group, memberId: string): MemberUsage {
  let paidCount = 0;
  let participatesCount = 0;
  let soleParticipantCount = 0;
  for (const e of group.expenses) {
    if (e.paidBy === memberId) paidCount++;
    if (e.participants.some((p) => p.memberId === memberId)) {
      participatesCount++;
      if (e.participants.length === 1) soleParticipantCount++;
    }
  }
  return { paidCount, participatesCount, soleParticipantCount };
}

/**
 * Quita a alguien de un gasto y redistribuye su parte entre los participantes
 * automáticos. Si ya no se puede cuadrar respetando los personalizados, vuelve a
 * dividir en partes iguales. Devuelve null si el gasto se queda sin participantes.
 */
function removeParticipant(expense: Expense, memberId: string): Expense | null {
  if (!expense.participants.some((p) => p.memberId === memberId)) return expense;
  const remaining = expense.participants.filter((p) => p.memberId !== memberId);
  if (remaining.length === 0) return null;

  const distribution = calculateExpenseDistribution(expense.totalAmount, remaining);
  const participants = distribution.issue
    ? resetToEqualSplit(expense.totalAmount, remaining.map((p) => p.memberId))
    : distribution.participants;
  return { ...expense, participants };
}

/**
 * Elimina un integrante. No se permite si pagó algún gasto (primero hay que
 * cambiar quién pagó o borrar esos gastos), porque se perdería ese dinero.
 */
export function removeMember(group: Group, memberId: string): Group {
  if (group.expenses.some((e) => e.paidBy === memberId)) {
    throw new Error('No se puede eliminar a alguien que pagó gastos del grupo.');
  }
  const expenses = group.expenses
    .map((e) => removeParticipant(e, memberId))
    .filter((e): e is Expense => e !== null);
  return { ...group, members: group.members.filter((m) => m.id !== memberId), expenses };
}

export function addExpense(group: Group, draft: ExpenseDraft): Group {
  const expense: Expense = { ...draft, id: createId(), date: new Date().toISOString() };
  return { ...group, expenses: [...group.expenses, expense] };
}

export function updateExpense(group: Group, expenseId: string, draft: ExpenseDraft): Group {
  return {
    ...group,
    expenses: group.expenses.map((e) => (e.id === expenseId ? { ...e, ...draft } : e)),
  };
}

export function deleteExpense(group: Group, expenseId: string): Group {
  return { ...group, expenses: group.expenses.filter((e) => e.id !== expenseId) };
}
