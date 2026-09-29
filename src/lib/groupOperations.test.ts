import { describe, expect, it } from 'vitest';
import { addExpense, addMember, createGroup, deleteExpense, getMemberUsage, removeMember, updateExpense } from './groupOperations';
import { calculateExpenseDistribution, resetToEqualSplit } from './distribution';
import { calculateBalances } from './balances';
import { pesos } from './money';
import { validateExpense, validateGroupDraft } from './validation';

function setup() {
  let group = createGroup({ name: ' Salida ', description: '', memberNames: ['Alfonso', 'Juan', ' ', 'Pedro'] });
  const [a, j, p] = group.members.map((m) => m.id) as [string, string, string];
  group = addExpense(group, {
    description: 'Cena',
    totalAmount: pesos(60000),
    paidBy: a,
    participants: calculateExpenseDistribution(pesos(60000), [
      { memberId: a, amount: 0, isCustom: false },
      { memberId: j, amount: 0, isCustom: false },
      { memberId: p, amount: pesos(30000), isCustom: true },
    ]).participants,
  });
  return { group, a, j, p };
}

describe('groupOperations', () => {
  it('crea el grupo limpiando nombres vacíos', () => {
    const { group } = setup();
    expect(group.name).toBe('Salida');
    expect(group.members.map((m) => m.name)).toEqual(['Alfonso', 'Juan', 'Pedro']);
  });

  it('quitar un participante redistribuye su parte y el gasto sigue cuadrando', () => {
    const { group, j, p } = setup();
    expect(getMemberUsage(group, j)).toEqual({ paidCount: 0, participatesCount: 1, soleParticipantCount: 0 });
    const updated = removeMember(group, j);
    const expense = updated.expenses[0]!;
    expect(expense.participants.map((x) => x.amount)).toEqual([pesos(30000), pesos(30000)]);
    expect(expense.participants.find((x) => x.memberId === p)?.isCustom).toBe(true);
    const balances = calculateBalances(updated.members, updated.expenses);
    expect(balances.reduce((s, x) => s + x.balance, 0)).toBe(0);
  });

  it('no deja quitar a quien pagó un gasto', () => {
    const { group, a } = setup();
    expect(() => removeMember(group, a)).toThrow();
  });

  it('editar y eliminar gastos', () => {
    const { group, a, j } = setup();
    const id = group.expenses[0]!.id;
    const edited = updateExpense(group, id, {
      description: 'Cena editada',
      totalAmount: pesos(10000),
      paidBy: j,
      participants: resetToEqualSplit(pesos(10000), [a, j]),
    });
    expect(edited.expenses[0]).toMatchObject({ id, description: 'Cena editada', paidBy: j });
    expect(deleteExpense(edited, id).expenses).toEqual([]);
  });
});

describe('validation', () => {
  const members = [
    { id: 'a', name: 'Alfonso' },
    { id: 'j', name: 'Juan' },
  ];

  it('valida el grupo', () => {
    expect(validateGroupDraft('', ['Ana'])).toHaveProperty('name');
    expect(validateGroupDraft('Viaje', ['', ' '])).toHaveProperty('members');
    expect(validateGroupDraft('Viaje', ['Ana', 'ana'])).toHaveProperty('members');
    expect(validateGroupDraft('Viaje', ['Ana', 'Beto'])).toEqual({});
  });

  it('valida el gasto campo por campo', () => {
    const errors = validateExpense({ description: ' ', totalAmount: 0, paidBy: 'x', participants: [], members });
    expect(Object.keys(errors).sort()).toEqual(['description', 'paidBy', 'participants', 'totalAmount']);
  });

  it('detecta faltantes y excesos en la distribución', () => {
    const base = { description: 'Bar', totalAmount: pesos(100), paidBy: 'a', members };
    expect(
      validateExpense({ ...base, participants: [{ memberId: 'a', amount: pesos(50), isCustom: true }] }).distribution,
    ).toBe('Faltan asignar $50,00.');
    expect(
      validateExpense({ ...base, participants: [{ memberId: 'a', amount: pesos(150), isCustom: true }] }).distribution,
    ).toBe('Los montos asignados superan el total en $50,00.');
    expect(
      validateExpense({ ...base, participants: [{ memberId: 'a', amount: pesos(100), isCustom: false }] }),
    ).toEqual({});
  });
});

describe('reintentos de transacciones', () => {
  it('aplicar dos veces el alta de un gasto no lo duplica', () => {
    const { group, a } = setup();
    const draft = { description: 'Taxi', totalAmount: pesos(900), paidBy: a, participants: resetToEqualSplit(pesos(900), [a]) };
    const addTaxi = (g: typeof group) => addExpense(g, draft, 'taxi-1', '2026-09-29T00:00:00.000Z');
    const once = addTaxi(group);
    const twice = addTaxi(addTaxi(group));
    expect(twice).toEqual(once);
    expect(twice.expenses.filter((e) => e.description === 'Taxi')).toHaveLength(1);
  });

  it('aplicar dos veces una edición da lo mismo que una', () => {
    const { group, j } = setup();
    const id = group.expenses[0]!.id;
    const draft = { ...group.expenses[0]!, description: 'Cena del viernes' };
    const edit = (g: typeof group) => updateExpense(g, id, draft);
    expect(edit(edit(group))).toEqual(edit(group));
    expect(edit(group).expenses).toHaveLength(1);
    void j;
  });

  it('aplicar dos veces el alta de una persona no la duplica', () => {
    const { group } = setup();
    const withSofi = addMember(addMember(group, 'Sofía', 'sofi'), 'Sofía', 'sofi');
    expect(withSofi.members.filter((m) => m.name === 'Sofía')).toHaveLength(1);
  });
});
