import type { Group } from '../types';
import { addExpense, createGroup } from './groupOperations';
import { calculateExpenseDistribution, resetToEqualSplit } from './distribution';
import { pesos } from './money';

/** Grupo de ejemplo para probar la app sin cargar todo a mano. */
export function createSampleGroup(): Group {
  let group = createGroup({
    name: 'Salida con los pibes',
    description: 'Viernes 25/09',
    memberNames: ['Alfonso', 'Juan', 'Pedro', 'Martín'],
  });
  const [alfonso, juan, pedro, martin] = group.members.map((m) => m.id) as [string, string, string, string];
  const trio = [alfonso, juan, pedro];

  group = addExpense(group, {
    description: 'Bar',
    totalAmount: pesos(30000),
    paidBy: alfonso,
    participants: resetToEqualSplit(pesos(30000), trio),
  });
  group = addExpense(group, {
    description: 'Cine',
    totalAmount: pesos(20000),
    paidBy: juan,
    participants: resetToEqualSplit(pesos(20000), trio),
  });
  group = addExpense(group, {
    description: 'Taxi',
    totalAmount: pesos(9000),
    paidBy: pedro,
    participants: resetToEqualSplit(pesos(9000), trio),
  });
  group = addExpense(group, {
    description: 'Cena',
    totalAmount: pesos(63000),
    paidBy: alfonso,
    participants: calculateExpenseDistribution(pesos(63000), [
      { memberId: alfonso, amount: 0, isCustom: false },
      { memberId: juan, amount: 0, isCustom: false },
      { memberId: pedro, amount: pesos(25000), isCustom: true },
      { memberId: martin, amount: pesos(8000), isCustom: true },
    ]).participants,
  });
  return group;
}
