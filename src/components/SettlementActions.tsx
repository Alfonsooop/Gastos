import { useState } from 'react';
import type { Group, Settlement } from '../types';
import { findPendingPayment } from '../lib/payments';
import { formatMoney } from '../lib/money';
import { usePaymentActions } from '../state/usePaymentActions';
import { PaymentDialog } from './PaymentDialog';

export interface SettlementActionsProps {
  group: Group;
  settlement: Settlement;
  /** Quién usa este teléfono (si eligió en "¿Quién sos?"). */
  meId?: string;
  /** Sin identidad (modo local o no eligió): cualquiera puede marcar un pago. */
  anonymous: boolean;
  /** Estilo sobre fondo oscuro (tarjeta personal). */
  dark?: boolean;
}

type DialogKind = 'report' | 'record' | null;

/**
 * Acciones de una transferencia pendiente de saldar:
 * - quien debe: "Ya pagué" → queda un aviso para que quien cobra lo confirme
 * - quien cobra: "Recibí el pago", o "Confirmar" / "No lo recibí" si hay un aviso
 */
export function SettlementActions({ group, settlement: s, meId, anonymous, dark = false }: SettlementActionsProps) {
  const actions = usePaymentActions(group);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [busy, setBusy] = useState(false);
  const nameOf = (id: string) => group.members.find((m) => m.id === id)?.name ?? '—';
  const pending = findPendingPayment(group, s.from, s.to);
  const isPayer = meId === s.from;
  const isReceiver = meId === s.to;

  const btn = (primary: boolean) =>
    `rounded-xl px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition active:scale-[0.98] disabled:opacity-50 ${
      primary
        ? dark
          ? 'bg-lime text-ink'
          : 'bg-ink text-white'
        : dark
          ? 'bg-white/10 text-white'
          : 'bg-card text-ink ring-1 ring-line'
    }`;
  const note = `text-xs ${dark ? 'text-white/70' : 'text-muted'}`;

  const run = async (action: () => Promise<boolean>) => {
    setBusy(true);
    await action();
    setBusy(false);
  };

  let content = null;
  if (pending) {
    if (isReceiver || (anonymous && !isPayer)) {
      content = (
        <>
          <p className={note}>
            ⏳ {nameOf(s.from)} avisó que pagó {formatMoney(pending.amount)}
          </p>
          <div className="flex gap-2">
            <button type="button" disabled={busy} className={btn(true)} onClick={() => run(() => actions.confirm(pending.id))}>
              Confirmar
            </button>
            <button type="button" disabled={busy} className={btn(false)} onClick={() => run(() => actions.remove(pending.id))}>
              No lo recibí
            </button>
          </div>
        </>
      );
    } else if (isPayer) {
      content = (
        <>
          <p className={note}>
            ⏳ Avisaste que pagaste {formatMoney(pending.amount)}. Falta que {nameOf(s.to)} lo confirme.
          </p>
          <button type="button" disabled={busy} className={btn(false)} onClick={() => run(() => actions.remove(pending.id))}>
            Deshacer aviso
          </button>
        </>
      );
    } else {
      content = (
        <p className={note}>
          ⏳ {nameOf(s.from)} avisó que pagó {formatMoney(pending.amount)}
        </p>
      );
    }
  } else if (isPayer) {
    content = (
      <button type="button" className={btn(true)} onClick={() => setDialog('report')}>
        Ya pagué
      </button>
    );
  } else if (isReceiver) {
    content = (
      <button type="button" className={btn(true)} onClick={() => setDialog('record')}>
        Recibí el pago
      </button>
    );
  } else if (anonymous) {
    content = (
      <button type="button" className={btn(false)} onClick={() => setDialog('record')}>
        Marcar como pagado
      </button>
    );
  }

  if (!content) return null;
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5">
      {content}
      {dialog === 'report' && (
        <PaymentDialog
          title="Avisar que pagaste"
          description={`Le avisamos a ${nameOf(s.to)} para que lo confirme. Hasta entonces, el balance no cambia.`}
          suggested={s.amount}
          confirmLabel="Avisar que pagué"
          onConfirm={(amount) => actions.report(s, amount)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'record' && (
        <PaymentDialog
          title={isReceiver ? 'Registrar pago recibido' : 'Marcar como pagado'}
          description={
            isReceiver
              ? `¿Cuánto te pagó ${nameOf(s.from)}? Se descuenta del balance de los dos.`
              : `${nameOf(s.from)} le pagó a ${nameOf(s.to)}. Se descuenta del balance de los dos.`
          }
          suggested={s.amount}
          confirmLabel="Registrar pago"
          onConfirm={(amount) => actions.record(s, amount)}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
