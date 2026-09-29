import { describe, expect, it } from 'vitest';
import { formatMoney, formatSignedMoney, parseMoneyInput } from './money';

describe('formatMoney', () => {
  it('usa formato argentino', () => {
    expect(formatMoney(1000000)).toBe('$10.000,00');
    expect(formatMoney(5900000)).toBe('$59.000,00');
    expect(formatMoney(125050)).toBe('$1.250,50');
    expect(formatMoney(0)).toBe('$0,00');
    expect(formatMoney(5)).toBe('$0,05');
    expect(formatMoney(-1000000)).toBe('-$10.000,00');
  });

  it('balance con signo', () => {
    expect(formatSignedMoney(1000000)).toBe('+$10.000,00');
    expect(formatSignedMoney(-1000000)).toBe('-$10.000,00');
    expect(formatSignedMoney(0)).toBe('$0,00');
  });
});

describe('parseMoneyInput', () => {
  it.each([
    ['60000', 6000000],
    ['60.000', 6000000],
    ['1.234.567', 123456700],
    ['13.333,33', 1333333],
    ['1250,5', 125050],
    ['1250.50', 125050],
    ['1.5', 150],
    ['$ 30.000,00', 3000000],
    ['0,01', 1],
  ])('"%s" → %i centavos', (text, cents) => {
    expect(parseMoneyInput(text)).toBe(cents);
  });

  it.each(['', 'abc', '1,2,3', '1,234', '12.34.5'])('"%s" es inválido', (text) => {
    expect(parseMoneyInput(text)).toBeNull();
  });
});
