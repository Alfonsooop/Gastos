import type { ReactNode } from 'react';
import type { Member, Settlement } from '../types';
import type { PersonalSummary } from '../lib/personalSummary';
import { formatMoney } from '../lib/money';
import { Avatar } from './Avatar';

interface PersonalCardProps {
  me: Member;
  members: Member[];
  summary: PersonalSummary;
  onChange: () => void;
  /** Botones de pago de cada transferencia ("Ya pagué", "Recibí el pago"...). */
  renderActions?: (settlement: Settlement) => ReactNode;
}

/** Lo primero que ve cada uno: cuánto tiene que pagar o recibir, y de quién. */
export function PersonalCard({ me, members, summary, onChange, renderActions }: PersonalCardProps) {
  const nameOf = new Map(members.map((m) => [m.id, m.name]));
  const { balance, toPay, toReceive } = summary;

  return (
    <div className="rounded-3xl bg-ink p-4 text-white sm:p-5">
      <div className="flex items-center gap-2.5">
        <Avatar name={me.name} size="sm" />
        <p className="flex-1 font-semibold">
          Vos <span className="text-white/60">· {me.name}</span>
        </p>
        <button type="button" onClick={onChange} className="text-xs font-semibold text-white/60 underline hover:text-white">
          No soy yo
        </button>
      </div>

      {balance === 0 ? (
        <p className="mt-3 font-display text-2xl font-bold">Estás saldado 🎉</p>
      ) : (
        <>
          <p className="mt-3 text-[11px] font-semibold tracking-wide text-lime uppercase">
            {balance < 0 ? 'Tenés que transferir' : 'Te tienen que transferir'}
          </p>
          <p className="tabular font-display text-3xl font-bold">{formatMoney(Math.abs(balance))}</p>
          <ul className="mt-3 space-y-1.5">
            {(balance < 0 ? toPay : toReceive).map((s) => {
              const other = nameOf.get(balance < 0 ? s.to : s.from) ?? '—';
              return (
                <li key={`${s.from}-${s.to}`} className="rounded-xl bg-white/10 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span>
                      {balance < 0 ? 'A ' : 'De '}
                      <strong>{other}</strong>
                    </span>
                    <span className="tabular font-bold">{formatMoney(s.amount)}</span>
                  </div>
                  {renderActions && <div className="empty:hidden mt-2">{renderActions(s)}</div>}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
