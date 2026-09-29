import { useState, type InputHTMLAttributes } from 'react';
import type { Cents } from '../types';
import { formatMoneyInput, parseMoneyInput } from '../lib/money';

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: Cents | null;
  onChange: (value: Cents | null) => void;
}

/**
 * Input de dinero: mientras se escribe muestra el texto tal cual (para no
 * "pelear" con el usuario) y al salir del campo lo formatea como $13.333,33.
 * Cada tecla emite el valor en centavos, así el resto de la pantalla se
 * recalcula en vivo.
 */
export function MoneyInput({ value, onChange, className = '', onFocus, onBlur, ...props }: MoneyInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value === null ? '' : formatMoneyInput(value));

  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">$</span>
      <input
        {...props}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={shown}
        onFocus={(e) => {
          // Mantener el mismo texto y seleccionarlo: lo que se escriba lo reemplaza.
          setDraft(shown);
          e.target.select();
          onFocus?.(e);
        }}
        onChange={(e) => {
          const text = e.target.value.replace(/[^\d.,]/g, '');
          setDraft(text);
          onChange(text === '' ? null : parseMoneyInput(text));
        }}
        onBlur={(e) => {
          setDraft(null);
          onBlur?.(e);
        }}
        className="tabular h-full w-full rounded-[inherit] bg-transparent pr-3 pl-7 text-right outline-none"
      />
    </div>
  );
}
