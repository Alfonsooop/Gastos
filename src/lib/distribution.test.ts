import { describe, expect, it } from 'vitest';
import { calculateExpenseDistribution, calculateTotalAssigned, resetToEqualSplit, splitEvenly } from './distribution';
import { pesos } from './money';
import type { ExpenseParticipant } from '../types';

const auto = (memberId: string): ExpenseParticipant => ({ memberId, amount: 0, isCustom: false });
const custom = (memberId: string, amountPesos: number): ExpenseParticipant => ({
  memberId,
  amount: pesos(amountPesos),
  isCustom: true,
});
const amounts = (participants: ExpenseParticipant[]) => participants.map((p) => p.amount / 100);

describe('splitEvenly', () => {
  it('reparte exacto cuando la división da justa', () => {
    expect(splitEvenly(pesos(30000), 3)).toEqual([pesos(10000), pesos(10000), pesos(10000)]);
  });

  it('$100 / 3 → 33,33 · 33,33 · 33,34', () => {
    expect(splitEvenly(pesos(100), 3)).toEqual([3333, 3333, 3334]);
  });

  it('$20.000 / 3 → 6.666,67 · 6.666,67 · 6.666,66', () => {
    expect(splitEvenly(pesos(20000), 3)).toEqual([666667, 666667, 666666]);
  });

  it('siempre suma el total y nadie difiere en más de 1 centavo', () => {
    for (let amount = 0; amount < 500; amount++) {
      for (let count = 1; count <= 9; count++) {
        const shares = splitEvenly(amount, count);
        expect(shares.reduce((a, b) => a + b, 0)).toBe(amount);
        expect(Math.max(...shares) - Math.min(...shares)).toBeLessThanOrEqual(1);
        expect(Math.min(...shares)).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('calculateExpenseDistribution', () => {
  const four = ['alfonso', 'juan', 'pedro', 'martin'];

  it('división equitativa: $30.000 / 3', () => {
    const r = calculateExpenseDistribution(pesos(30000), ['a', 'j', 'p'].map(auto));
    expect(amounts(r.participants)).toEqual([10000, 10000, 10000]);
    expect(r.issue).toBeNull();
    expect(r.totalAssigned).toBe(pesos(30000));
  });

  it('división con centavos: $100 / 3', () => {
    const r = calculateExpenseDistribution(pesos(100), ['a', 'j', 'p'].map(auto));
    expect(amounts(r.participants)).toEqual([33.33, 33.33, 33.34]);
    expect(r.totalAssigned).toBe(pesos(100));
  });

  it('un monto personalizado: $60.000 con Pedro = $20.000', () => {
    const r = calculateExpenseDistribution(pesos(60000), [auto('alfonso'), auto('juan'), custom('pedro', 20000), auto('martin')]);
    expect(amounts(r.participants)).toEqual([13333.33, 13333.33, 20000, 13333.34]);
    expect(r.totalAssigned).toBe(pesos(60000));
    expect(r.issue).toBeNull();
    expect(r.participants.map((p) => p.isCustom)).toEqual([false, false, true, false]);
  });

  it('varios montos personalizados: Pedro = $20.000 y Martín = $10.000', () => {
    const r = calculateExpenseDistribution(pesos(60000), [
      auto('alfonso'),
      auto('juan'),
      custom('pedro', 20000),
      custom('martin', 10000),
    ]);
    expect(amounts(r.participants)).toEqual([15000, 15000, 20000, 10000]);
    expect(r.issue).toBeNull();
  });

  it('$100.000 entre 5 con Juan = $40.000 → el resto a $15.000', () => {
    const r = calculateExpenseDistribution(pesos(100000), [
      auto('alfonso'),
      custom('juan', 40000),
      auto('pedro'),
      auto('martin'),
      auto('sofia'),
    ]);
    expect(amounts(r.participants)).toEqual([15000, 40000, 15000, 15000, 15000]);
  });

  it('montos personalizados que superan el total devuelven error sin tocarlos', () => {
    const r = calculateExpenseDistribution(pesos(60000), [
      auto('alfonso'),
      auto('juan'),
      custom('pedro', 40000),
      custom('martin', 30000),
    ]);
    expect(r.issue).toEqual({ type: 'custom-exceeds-total', excess: pesos(10000) });
    expect(amounts(r.participants)).toEqual([0, 0, 40000, 30000]);
  });

  it('si todos son personalizados y no llegan al total, informa lo que falta', () => {
    const r = calculateExpenseDistribution(pesos(60000), [custom('a', 30000), custom('b', 25000)]);
    expect(r.issue).toEqual({ type: 'unassigned', missing: pesos(5000) });
  });

  it('sin participantes devuelve error', () => {
    expect(calculateExpenseDistribution(pesos(1000), []).issue).toEqual({ type: 'no-participants' });
  });

  it('agregar un participante recalcula los automáticos ($30.000: 3 → 4 personas)', () => {
    const three = calculateExpenseDistribution(pesos(30000), four.slice(0, 3).map(auto));
    expect(amounts(three.participants)).toEqual([10000, 10000, 10000]);
    const withMartin = calculateExpenseDistribution(pesos(30000), four.map(auto));
    expect(amounts(withMartin.participants)).toEqual([7500, 7500, 7500, 7500]);
  });

  it('al agregar participantes se mantienen los personalizados', () => {
    const r = calculateExpenseDistribution(pesos(30000), [auto('alfonso'), custom('juan', 12000), auto('pedro'), auto('martin')]);
    expect(amounts(r.participants)).toEqual([6000, 12000, 6000, 6000]);
  });

  it('cambiar el total recalcula sólo los automáticos', () => {
    const r = calculateExpenseDistribution(pesos(80000), [auto('alfonso'), auto('juan'), custom('pedro', 20000), custom('martin', 10000)]);
    expect(amounts(r.participants)).toEqual([25000, 25000, 20000, 10000]);
  });

  it('caso cena: $63.000, Pedro $25.000 y Martín $8.000', () => {
    const initial = calculateExpenseDistribution(pesos(63000), four.map(auto));
    expect(amounts(initial.participants)).toEqual([15750, 15750, 15750, 15750]);

    const r = calculateExpenseDistribution(pesos(63000), [auto('alfonso'), auto('juan'), custom('pedro', 25000), custom('martin', 8000)]);
    expect(amounts(r.participants)).toEqual([15000, 15000, 25000, 8000]);
    expect(calculateTotalAssigned(r.participants)).toBe(pesos(63000));
  });

  it('restablecer división equitativa descarta los personalizados', () => {
    const r = resetToEqualSplit(pesos(60000), four);
    expect(amounts(r)).toEqual([15000, 15000, 15000, 15000]);
    expect(r.every((p) => !p.isCustom)).toBe(true);
  });
});
