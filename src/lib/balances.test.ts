import { describe, expect, it } from 'vitest';
import { applySettlements, calculateBalances, calculateGroupTotal, calculateSettlements } from './balances';
import { calculateExpenseDistribution, resetToEqualSplit } from './distribution';
import { pesos } from './money';
import type { Expense, Member, MemberBalance } from '../types';

const members: Member[] = [
  { id: 'alfonso', name: 'Alfonso' },
  { id: 'juan', name: 'Juan' },
  { id: 'pedro', name: 'Pedro' },
  { id: 'martin', name: 'Martín' },
];
const [alfonso, juan, pedro] = members as [Member, Member, Member, Member];

function expense(id: string, total: number, paidBy: string, participantIds: string[]): Expense {
  return {
    id,
    description: id,
    totalAmount: pesos(total),
    paidBy,
    participants: resetToEqualSplit(pesos(total), participantIds),
    date: '2026-09-25T20:00:00.000Z',
  };
}

const sumBalances = (balances: MemberBalance[]) => balances.reduce((s, b) => s + b.balance, 0);
const byId = (balances: MemberBalance[]) => Object.fromEntries(balances.map((b) => [b.memberId, b]));

function expectAllSettled(balances: MemberBalance[]) {
  const after = applySettlements(balances, calculateSettlements(balances));
  for (const value of after.values()) expect(value).toBe(0);
}

const b = (memberId: string, balancePesos: number): MemberBalance => ({
  memberId,
  paid: 0,
  owed: 0,
  balance: pesos(balancePesos),
});

describe('caso completo: bar, cine y taxi', () => {
  const trio = [alfonso.id, juan.id, pedro.id];
  const expenses = [
    expense('bar', 30000, alfonso.id, trio),
    expense('cine', 20000, juan.id, trio),
    expense('taxi', 9000, pedro.id, trio),
  ];
  const group = [alfonso, juan, pedro];
  const balances = calculateBalances(group, expenses);
  const result = byId(balances);

  it('cine se divide 6.666,67 · 6.666,67 · 6.666,66', () => {
    expect(expenses[1]?.participants.map((p) => p.amount)).toEqual([666667, 666667, 666666]);
  });

  it('total gastado $59.000', () => {
    expect(calculateGroupTotal(expenses)).toBe(pesos(59000));
  });

  it('calcula pagado, le corresponde y balance', () => {
    expect(result.alfonso).toEqual({ memberId: 'alfonso', paid: pesos(30000), owed: pesos(19666.67), balance: pesos(10333.33) });
    expect(result.juan).toEqual({ memberId: 'juan', paid: pesos(20000), owed: pesos(19666.67), balance: pesos(333.33) });
    expect(result.pedro).toEqual({ memberId: 'pedro', paid: pesos(9000), owed: pesos(19666.66), balance: pesos(-10666.66) });
  });

  it('la suma de balances es 0', () => {
    expect(sumBalances(balances)).toBe(0);
  });

  it('Pedro le paga a Alfonso y a Juan y todos quedan en 0', () => {
    const settlements = calculateSettlements(balances);
    expect(settlements).toEqual([
      { from: 'pedro', to: 'alfonso', amount: pesos(10333.33) },
      { from: 'pedro', to: 'juan', amount: pesos(333.33) },
    ]);
    expectAllSettled(balances);
  });
});

describe('caso completo: cena con división personalizada', () => {
  const cena: Expense = {
    id: 'cena',
    description: 'Cena',
    totalAmount: pesos(63000),
    paidBy: 'alfonso',
    date: '2026-09-25T22:00:00.000Z',
    participants: calculateExpenseDistribution(pesos(63000), [
      { memberId: 'alfonso', amount: 0, isCustom: false },
      { memberId: 'juan', amount: 0, isCustom: false },
      { memberId: 'pedro', amount: pesos(25000), isCustom: true },
      { memberId: 'martin', amount: pesos(8000), isCustom: true },
    ]).participants,
  };
  const balances = calculateBalances(members, [cena]);

  it('balances: Alfonso +48.000, Juan -15.000, Pedro -25.000, Martín -8.000', () => {
    expect(balances.map((x) => x.balance)).toEqual([pesos(48000), pesos(-15000), pesos(-25000), pesos(-8000)]);
    expect(sumBalances(balances)).toBe(0);
  });

  it('liquidación: cada uno le paga a Alfonso', () => {
    expect(calculateSettlements(balances)).toEqual([
      { from: 'juan', to: 'alfonso', amount: pesos(15000) },
      { from: 'pedro', to: 'alfonso', amount: pesos(25000) },
      { from: 'martin', to: 'alfonso', amount: pesos(8000) },
    ]);
    expectAllSettled(balances);
  });
});

describe('calculateBalances', () => {
  it('ejemplo del gasto de $60.000 pagado por Alfonso entre 4', () => {
    const balances = calculateBalances(members, [expense('cena', 60000, 'alfonso', members.map((m) => m.id))]);
    expect(balances.map((x) => x.balance)).toEqual([pesos(45000), pesos(-15000), pesos(-15000), pesos(-15000)]);
  });

  it('quien no participa ni paga queda en 0', () => {
    const balances = calculateBalances(members, [expense('taxi', 9000, 'pedro', ['alfonso', 'pedro'])]);
    expect(byId(balances).martin?.balance).toBe(0);
    expect(sumBalances(balances)).toBe(0);
  });

  it('la suma de balances es 0 con muchos gastos con centavos', () => {
    const ids = members.map((m) => m.id);
    const expenses = Array.from({ length: 40 }, (_, i) =>
      expense(`e${i}`, 1000 + i * 37.13, ids[i % 4]!, ids.slice(0, 1 + (i % 4))),
    );
    expect(sumBalances(calculateBalances(members, expenses))).toBe(0);
  });
});

describe('calculateSettlements', () => {
  it('Alfonso +20.000; Juan -10.000, Pedro -5.000, Martín -5.000', () => {
    const balances = [b('alfonso', 20000), b('juan', -10000), b('pedro', -5000), b('martin', -5000)];
    expect(calculateSettlements(balances)).toEqual([
      { from: 'juan', to: 'alfonso', amount: pesos(10000) },
      { from: 'pedro', to: 'alfonso', amount: pesos(5000) },
      { from: 'martin', to: 'alfonso', amount: pesos(5000) },
    ]);
  });

  it('Alfonso +45.000; Juan -12.000, Pedro -25.000, Martín -8.000', () => {
    const balances = [b('alfonso', 45000), b('juan', -12000), b('pedro', -25000), b('martin', -8000)];
    expect(calculateSettlements(balances)).toHaveLength(3);
    expectAllSettled(balances);
  });

  it('prioriza coincidencias exactas para ahorrar transferencias', () => {
    // Greedy puro necesitaría 4 (a→x 4, c→y 3, d→x 2, d→y 1).
    // Emparejando primero a(-4) con y(+4) alcanza con 3.
    const balances = [b('x', 6), b('y', 4), b('a', -4), b('c', -3), b('d', -3)];
    const settlements = calculateSettlements(balances);
    expect(settlements).toHaveLength(3);
    expect(settlements).toContainEqual({ from: 'a', to: 'y', amount: pesos(4) });
    expectAllSettled(balances);
  });

  it('sin deudas no hay transferencias', () => {
    expect(calculateSettlements([b('a', 0), b('b', 0)])).toEqual([]);
  });

  it('siempre deja todo en 0 (casos aleatorios)', () => {
    let seed = 42;
    const rand = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
    for (let round = 0; round < 200; round++) {
      const n = 2 + Math.floor(rand() * 8);
      const values = Array.from({ length: n - 1 }, () => Math.round((rand() - 0.5) * 2_000_000));
      values.push(-values.reduce((s, v) => s + v, 0));
      const balances = values.map((balance, i) => ({ memberId: `m${i}`, paid: 0, owed: 0, balance }));
      const settlements = calculateSettlements(balances);
      expect(settlements.length).toBeLessThanOrEqual(n - 1);
      expect(settlements.every((s) => s.amount > 0)).toBe(true);
      expectAllSettled(balances);
    }
  });
});
