import { describe, expect, it } from 'vitest';
import { cleanItems, firstItem, sumItems, withItems } from './expenseItems';
import { calculateExpenseDistribution } from './distribution';
import { pesos } from './money';
import type { ExpenseParticipant } from '../types';

const item = (description: string, amountPesos: number) => ({ id: description, description, amount: pesos(amountPesos) });
const auto = (memberId: string): ExpenseParticipant => ({ memberId, amount: 0, isCustom: false });

describe('detalle por persona', () => {
  it('el monto de la persona es la suma de sus ítems y queda personalizado', () => {
    const alfonso = withItems(auto('alfonso'), [item('Hamburguesa', 3000), item('Cerveza', 2000)]);
    expect(alfonso).toMatchObject({ amount: pesos(5000), isCustom: true });
    expect(sumItems(alfonso.items!)).toBe(pesos(5000));
  });

  it('el resto del gasto se reparte entre los demás', () => {
    const r = calculateExpenseDistribution(pesos(20000), [
      withItems(auto('alfonso'), [item('Hamburguesa', 3000), item('Cerveza', 2000)]),
      auto('juan'),
      auto('pedro'),
    ]);
    expect(r.participants.map((p) => p.amount)).toEqual([pesos(5000), pesos(7500), pesos(7500)]);
    expect(r.participants[0]?.items).toHaveLength(2);
    expect(r.issue).toBeNull();
  });

  it('sin ítems vuelve a ser automático', () => {
    const p = withItems(withItems(auto('alfonso'), [item('Pizza', 1000)]), []);
    expect(p).toEqual({ memberId: 'alfonso', amount: 0, isCustom: false });
  });

  it('el primer ítem conserva el monto personalizado que ya tenía', () => {
    expect(firstItem({ memberId: 'a', amount: pesos(5000), isCustom: true }).amount).toBe(pesos(5000));
    expect(firstItem({ memberId: 'a', amount: pesos(5000), isCustom: false }).amount).toBe(0);
  });

  it('al guardar se descartan renglones vacíos', () => {
    const p = withItems(auto('a'), [item('  Pizza ', 1000), { id: 'x', description: ' ', amount: 0 }]);
    expect(cleanItems(p).items).toEqual([{ id: '  Pizza ', description: 'Pizza', amount: pesos(1000) }]);
    const onlyEmpty = withItems(auto('a'), [{ id: 'x', description: '', amount: 0 }]);
    expect(cleanItems(onlyEmpty)).not.toHaveProperty('items');
  });
});
