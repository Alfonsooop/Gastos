import type { Cents, ExpenseParticipant, Member } from '../types';
import { calculateTotalAssigned } from './distribution';
import { formatMoney } from './money';

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export function validateMemberName(name: string, members: Member[], ignoreId?: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return 'Escribí el nombre de la persona.';
  const duplicate = members.some(
    (m) => m.id !== ignoreId && m.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (duplicate) return `Ya hay alguien llamado "${trimmed}" en el grupo.`;
  return undefined;
}

export function validateGroupDraft(name: string, memberNames: string[]): FieldErrors<'name' | 'members'> {
  const errors: FieldErrors<'name' | 'members'> = {};
  if (!name.trim()) errors.name = 'El grupo necesita un nombre.';

  const names = memberNames.map((n) => n.trim()).filter(Boolean);
  const lower = names.map((n) => n.toLowerCase());
  const duplicate = names.find((_, i) => lower.indexOf(lower[i] ?? '') !== i);
  if (names.length === 0) errors.members = 'Agregá al menos una persona.';
  else if (duplicate) errors.members = `"${duplicate}" está repetido. Usá nombres distintos.`;
  return errors;
}

export interface ExpenseValidationInput {
  description: string;
  totalAmount: Cents | null;
  paidBy: string;
  participants: ExpenseParticipant[];
  members: Member[];
}

export type ExpenseField = 'description' | 'totalAmount' | 'paidBy' | 'participants' | 'distribution';

export function validateExpense(input: ExpenseValidationInput): FieldErrors<ExpenseField> {
  const errors: FieldErrors<ExpenseField> = {};
  const { description, totalAmount, paidBy, participants, members } = input;

  if (!description.trim()) errors.description = 'Escribí qué fue el gasto (ej: "Cena").';

  if (totalAmount === null) errors.totalAmount = 'Ingresá el monto total.';
  else if (totalAmount <= 0) errors.totalAmount = 'El monto tiene que ser mayor a $0.';

  if (!members.some((m) => m.id === paidBy)) errors.paidBy = 'Elegí quién pagó.';

  if (participants.length === 0) errors.participants = 'Seleccioná al menos un participante.';
  else if (totalAmount !== null && totalAmount > 0) {
    const negative = participants.find((p) => p.amount < 0);
    const assigned = calculateTotalAssigned(participants);
    if (negative) errors.distribution = 'No se permiten montos negativos.';
    else if (assigned < totalAmount)
      errors.distribution = `Faltan asignar ${formatMoney(totalAmount - assigned)}.`;
    else if (assigned > totalAmount)
      errors.distribution = `Los montos asignados superan el total en ${formatMoney(assigned - totalAmount)}.`;
  }
  return errors;
}

export function hasErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean);
}
