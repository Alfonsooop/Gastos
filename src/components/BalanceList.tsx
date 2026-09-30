import type { Member, MemberBalance } from '../types';
import { formatMoney, formatSignedMoney } from '../lib/money';
import { Avatar } from './Avatar';

function balanceStatus(balance: number) {
  if (balance > 0) return { label: 'Recibe', className: 'bg-plus-soft text-plus', amountClass: 'text-plus' };
  if (balance < 0) return { label: 'Debe', className: 'bg-minus-soft text-minus', amountClass: 'text-minus' };
  return { label: 'Saldado', className: 'bg-ink/5 text-muted', amountClass: 'text-muted' };
}

/**
 * Tabla de resumen. En pantallas chicas cada fila se apila (nombre + balance
 * arriba, pagó / le corresponde abajo); desde `sm` se ve como tabla clásica.
 */
export function BalanceList({ members, balances, meId }: { members: Member[]; balances: MemberBalance[]; meId?: string }) {
  const nameOf = new Map(members.map((m) => [m.id, m.name]));
  return (
    <div className="overflow-hidden rounded-3xl bg-card ring-1 ring-line">
      <div className="hidden grid-cols-[1.4fr_1fr_1fr_1.1fr] gap-3 border-b border-line px-5 py-3 text-xs font-semibold tracking-wide text-muted uppercase sm:grid">
        <span>Persona</span>
        <span className="text-right">Pagó</span>
        <span className="text-right whitespace-nowrap">Le corresponde</span>
        <span className="text-right">Balance</span>
      </div>
      <ul className="divide-y divide-line">
        {balances.map((b) => {
          const name = nameOf.get(b.memberId) ?? '—';
          const status = balanceStatus(b.balance);
          return (
            <li
              key={b.memberId}
              className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 sm:grid-cols-[1.4fr_1fr_1fr_1.1fr] sm:px-5"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar name={name} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{name}</span>
                  {(b.sent > 0 || b.received > 0) && (
                    <span className="block truncate text-xs text-muted">
                      {b.sent > 0 && `Transfirió ${formatMoney(b.sent)}`}
                      {b.sent > 0 && b.received > 0 && ' · '}
                      {b.received > 0 && `Recibió ${formatMoney(b.received)}`}
                    </span>
                  )}
                </span>
                {b.memberId === meId && (
                  <span className="shrink-0 rounded-full bg-lime px-1.5 py-0.5 text-[10px] font-bold uppercase">vos</span>
                )}
              </span>
              {/* En celular, "Pagó" y "Le corresponde" van en una línea a lo ancho; desde sm son columnas. */}
              <span className="order-3 col-span-2 flex justify-between gap-3 sm:contents">
                <span className="text-sm text-muted sm:text-right sm:text-[15px] sm:text-ink">
                  <span className="sm:hidden">Pagó </span>
                  <span className="tabular">{formatMoney(b.paid)}</span>
                </span>
                <span className="text-right text-sm text-muted sm:text-[15px] sm:text-ink">
                  <span className="sm:hidden">Le corresponde </span>
                  <span className="tabular">{formatMoney(b.owed)}</span>
                </span>
              </span>
              <span className="order-2 flex flex-col items-end sm:order-none">
                <span className={`tabular font-bold ${status.amountClass}`}>{formatSignedMoney(b.balance)}</span>
                <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>
                  {status.label}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
