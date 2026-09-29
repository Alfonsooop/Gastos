import type { Cents } from '../types';

/** Agrega separador de miles con punto: 1234567 → "1.234.567". */
function groupThousands(integerPart: number): string {
  return String(integerPart).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Formatea centavos en formato argentino: 125050 → "$1.250,50". */
export function formatMoney(cents: Cents): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(Math.round(cents));
  const integerPart = Math.floor(abs / 100);
  const decimalPart = String(abs % 100).padStart(2, '0');
  return `${sign}$${groupThousands(integerPart)},${decimalPart}`;
}

/** Igual que formatMoney pero con signo explícito para balances: "+$10.000,00". */
export function formatSignedMoney(cents: Cents): string {
  if (cents > 0) return `+${formatMoney(cents)}`;
  return formatMoney(cents);
}

/** Formato para mostrar dentro de un input editable (sin "$"): 1333333 → "13.333,33". */
export function formatMoneyInput(cents: Cents): string {
  return formatMoney(cents).replace('$', '');
}

/**
 * Convierte lo que escribe el usuario a centavos. Acepta formato argentino
 * ("13.333,33", "60.000", "1250,5") y también punto decimal simple ("1250.50").
 * Devuelve null si el texto no es un número válido.
 */
export function parseMoneyInput(raw: string): Cents | null {
  const text = raw.replace(/[\s$]/g, '');
  if (text === '') return null;
  if (!/^-?[\d.,]+$/.test(text)) return null;

  let normalized: string;
  if (text.includes(',')) {
    // La coma es el separador decimal; los puntos son de miles.
    if (text.split(',').length > 2) return null;
    normalized = text.replace(/\./g, '').replace(',', '.');
  } else {
    const parts = text.split('.');
    const last = parts[parts.length - 1] ?? '';
    const looksLikeThousands = parts.length > 1 && last.length === 3;
    normalized = looksLikeThousands
      ? parts.join('')
      : parts.length === 2
        ? text
        : parts.length === 1
          ? text
          : '';
  }

  if (normalized === '' || normalized === '-' || normalized === '.') return null;
  const [intPart = '', decPart = ''] = normalized.split('.');
  if (decPart.length > 2) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  // Construimos los centavos a partir del texto para no arrastrar errores de float.
  const negative = intPart.startsWith('-');
  const cents =
    Number(intPart.replace('-', '') || '0') * 100 + Number(decPart.padEnd(2, '0') || '0');
  return negative ? -cents : cents;
}

/** Atajo para escribir importes en pesos (tests, datos de ejemplo): pesos(15000) → 1500000. */
export function pesos(amount: number): Cents {
  return Math.round(amount * 100);
}
