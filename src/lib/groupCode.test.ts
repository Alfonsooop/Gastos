import { describe, expect, it } from 'vitest';
import { generateGroupCode, isValidGroupCode, normalizeGroupCode } from './groupCode';
import { getPersonalSummary } from './personalSummary';
import { calculateBalances, calculateSettlements } from './balances';
import { resetToEqualSplit } from './distribution';
import { pesos } from './money';

describe('código de grupo', () => {
  it('genera códigos válidos de 6 caracteres', () => {
    for (let i = 0; i < 200; i++) expect(isValidGroupCode(generateGroupCode())).toBe(true);
  });

  it('no usa caracteres que se confunden', () => {
    const all = Array.from({ length: 500 }, () => generateGroupCode()).join('');
    expect(all).not.toMatch(/[01OIL]/);
  });

  it('normaliza lo que escribe el usuario', () => {
    expect(normalizeGroupCode(' k7p-2qx ')).toBe('K7P2QX');
    expect(isValidGroupCode(normalizeGroupCode('k7p 2qx'))).toBe(true);
    expect(isValidGroupCode('K7P2Q')).toBe(false);
    expect(isValidGroupCode('K7P2Q0')).toBe(false);
  });
});

describe('getPersonalSummary', () => {
  const members = [
    { id: 'alfonso', name: 'Alfonso' },
    { id: 'juan', name: 'Juan' },
    { id: 'pedro', name: 'Pedro' },
  ];
  const ids = members.map((m) => m.id);
  const expenses = [
    { id: 'bar', description: 'Bar', totalAmount: pesos(30000), paidBy: 'alfonso', participants: resetToEqualSplit(pesos(30000), ids), date: '' },
    { id: 'taxi', description: 'Taxi', totalAmount: pesos(3000), paidBy: 'juan', participants: resetToEqualSplit(pesos(3000), ids), date: '' },
  ];
  const balances = calculateBalances(members, expenses);
  const settlements = calculateSettlements(balances);

  it('dice a quién le tiene que pagar cada uno', () => {
    const pedro = getPersonalSummary('pedro', balances, settlements);
    expect(pedro.balance).toBe(pesos(-11000));
    expect(pedro.toPay).toEqual([{ from: 'pedro', to: 'alfonso', amount: pesos(11000) }]);
    expect(pedro.toReceive).toEqual([]);
  });

  it('dice quién le tiene que pagar a cada uno', () => {
    const alfonso = getPersonalSummary('alfonso', balances, settlements);
    expect(alfonso.balance).toBe(pesos(19000));
    expect(alfonso.toReceive.reduce((s, x) => s + x.amount, 0)).toBe(pesos(19000));
    expect(alfonso.toPay).toEqual([]);
  });
});
