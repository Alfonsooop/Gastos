import type { ReactNode } from 'react';
import type { Member, Settlement } from '../types';
import { formatMoney } from '../lib/money';
import { Avatar } from './Avatar';

interface SettlementListProps {
  members: Member[];
  settlements: Settlement[];
  /** Botones/estado de pago debajo de cada transferencia (opcional). */
  renderActions?: (settlement: Settlement) => ReactNode;
}

export function SettlementList({ members, settlements, renderActions }: SettlementListProps) {
  const nameOf = new Map(members.map((m) => [m.id, m.name]));
  return (
    <ul className="space-y-2">
      {settlements.map((s) => {
        const from = nameOf.get(s.from) ?? '—';
        const to = nameOf.get(s.to) ?? '—';
        return (
          <li key={`${s.from}-${s.to}`} className="rounded-2xl bg-card px-4 py-3 ring-1 ring-line">
            <div className="flex items-center gap-3">
              <Avatar name={from} size="sm" />
              <div className="min-w-0 flex-1 text-[15px] leading-snug">
                <span className="font-semibold">{from}</span>
                <span className="mx-1.5 text-muted">le paga a</span>
                <span className="font-semibold">{to}</span>
              </div>
              <span className="tabular shrink-0 rounded-xl bg-lime px-2.5 py-1 font-bold">{formatMoney(s.amount)}</span>
            </div>
            {renderActions && <div className="empty:hidden mt-2.5">{renderActions(s)}</div>}
          </li>
        );
      })}
    </ul>
  );
}

/** Texto plano para compartir por WhatsApp o donde sea. */
export function settlementsToText(groupName: string, members: Member[], settlements: Settlement[]): string {
  const nameOf = new Map(members.map((m) => [m.id, m.name]));
  if (settlements.length === 0) return `${groupName}: ¡todo está saldado! 🎉`;
  const lines = settlements.map((s) => `• ${nameOf.get(s.from)} → ${nameOf.get(s.to)}: ${formatMoney(s.amount)}`);
  return [`💸 ${groupName} — para saldar las cuentas:`, ...lines].join('\n');
}
