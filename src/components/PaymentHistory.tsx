import { useState } from 'react';
import type { Group, Payment } from '../types';
import { formatMoney } from '../lib/money';
import { usePaymentActions } from '../state/usePaymentActions';
import { ConfirmDialog } from './ConfirmDialog';
import { SectionTitle } from './Card';

const dateFormat = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' });

/** Pagos entre integrantes ya registrados, con opción de deshacer uno cargado por error. */
export function PaymentHistory({ group }: { group: Group }) {
  const { remove } = usePaymentActions(group);
  const [toRemove, setToRemove] = useState<Payment | null>(null);
  const nameOf = (id: string) => group.members.find((m) => m.id === id)?.name ?? '—';
  const payments = [...(group.payments ?? [])].reverse();

  if (payments.length === 0) return null;
  return (
    <section>
      <SectionTitle>Pagos</SectionTitle>
      <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-card ring-1 ring-line">
        {payments.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-4 py-3">
            <span className="text-lg" aria-hidden>
              {p.status === 'confirmed' ? '✅' : '⏳'}
            </span>
            <div className="min-w-0 flex-1 text-[15px] leading-snug">
              <p>
                <strong>{nameOf(p.from)}</strong> <span className="text-muted">→</span> <strong>{nameOf(p.to)}</strong>
              </p>
              <p className="text-xs text-muted">
                {dateFormat.format(new Date(p.date))} · {p.status === 'confirmed' ? 'Confirmado' : `Falta que ${nameOf(p.to)} confirme`}
              </p>
            </div>
            <span className="tabular font-semibold">{formatMoney(p.amount)}</span>
            <button
              type="button"
              onClick={() => setToRemove(p)}
              aria-label={`Borrar pago de ${nameOf(p.from)} a ${nameOf(p.to)}`}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-lg text-muted hover:bg-minus-soft hover:text-minus"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={toRemove !== null}
        title="¿Borrar este pago?"
        confirmLabel="Borrar pago"
        onCancel={() => setToRemove(null)}
        onConfirm={() => {
          if (toRemove) void remove(toRemove.id);
          setToRemove(null);
        }}
      >
        {toRemove && (
          <>
            Se borra el pago de <strong>{nameOf(toRemove.from)}</strong> a <strong>{nameOf(toRemove.to)}</strong> por{' '}
            {formatMoney(toRemove.amount)} y los balances vuelven a como estaban antes.
          </>
        )}
      </ConfirmDialog>
    </section>
  );
}
