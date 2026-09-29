import type { ReactNode } from 'react';
import type { Group } from '../types';
import { calculateGroupTotal } from '../lib/balances';
import { formatMoney } from '../lib/money';
import { paths } from '../state/router';
import { Avatar } from './Avatar';

export function GroupCard({ group, action }: { group: Group; action?: ReactNode }) {
  const count = group.members.length;
  return (
    <div className="group relative flex items-center gap-3 rounded-3xl bg-card p-4 ring-1 ring-line transition hover:ring-ink/30 sm:p-5">
      <a href={paths.group(group.id)} className="absolute inset-0 rounded-3xl" aria-label={`Abrir ${group.name}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg font-bold">{group.name}</p>
        {group.description && <p className="truncate text-sm text-muted">{group.description}</p>}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex -space-x-2">
            {group.members.slice(0, 5).map((m) => (
              <span key={m.id} className="rounded-full ring-2 ring-card">
                <Avatar name={m.name} size="sm" />
              </span>
            ))}
          </div>
          <span className="text-sm text-muted">
            {count} {count === 1 ? 'integrante' : 'integrantes'}
          </span>
        </div>
      </div>
      <div className="text-right">
        <p className="tabular font-bold">{formatMoney(calculateGroupTotal(group.expenses))}</p>
        <p className="text-xs text-muted">gastados</p>
      </div>
      {action && <div className="relative z-10">{action}</div>}
    </div>
  );
}
