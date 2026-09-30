import { useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import type { Cents } from '../types';
import { formatMoney } from '../lib/money';
import { Button } from './Button';
import { FieldError, inputClass } from './Field';
import { MoneyInput } from './MoneyInput';

interface PaymentDialogProps {
  title: string;
  description: string;
  /** Monto sugerido (lo que se debe). Se puede cambiar para pagos parciales. */
  suggested: Cents;
  confirmLabel: string;
  onConfirm: (amount: Cents) => Promise<boolean>;
  onClose: () => void;
}

export function PaymentDialog({ title, description, suggested, confirmLabel, onConfirm, onClose }: PaymentDialogProps) {
  const [amount, setAmount] = useState<Cents | null>(suggested);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return setError('Ingresá un monto mayor a $0.');
    if (amount > suggested) return setError(`Es más de lo que se debe (${formatMoney(suggested)}).`);
    setSaving(true);
    const ok = await onConfirm(amount);
    setSaving(false);
    if (ok) onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal aria-label={title}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <form
        onSubmit={submit}
        noValidate
        className="animate-rise safe-bottom relative w-full max-w-md rounded-t-3xl bg-card px-5 pt-6 shadow-xl sm:mx-4 sm:rounded-3xl sm:pb-5"
      >
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <p className="mt-1 text-[15px] text-ink-soft">{description}</p>
        <label htmlFor="payment-amount" className="mt-5 mb-1.5 block text-sm font-semibold">
          Monto
        </label>
        <MoneyInput
          id="payment-amount"
          value={amount}
          onChange={(v) => {
            setAmount(v);
            setError(undefined);
          }}
          className={`${inputClass(Boolean(error))} px-0 text-lg font-bold`}
        />
        <FieldError>{error}</FieldError>
        {amount !== null && amount > 0 && amount < suggested && (
          <p className="mt-1.5 text-sm text-muted">Pago parcial: quedan {formatMoney(suggested - amount)} por saldar.</p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : confirmLabel}
          </Button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
