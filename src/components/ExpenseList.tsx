import type { Group } from '../types';
import { formatMoney } from '../lib/money';
import { getExpenseEmoji } from '../lib/expenseEmoji';
import { paths } from '../state/router';
import { EmptyState } from './EmptyState';

export function ExpenseList({ group }: { group: Group }) {
  const nameOf = new Map(group.members.map((m) => [m.id, m.name]));

  if (group.expenses.length === 0) {
    return (
      <EmptyState icon="🧾" title="Todavía no hay gastos registrados." text="Tocá “+ Agregar gasto” para cargar el primero." />
    );
  }

  const newestFirst = [...group.expenses].reverse();
  return (
    <ul className="space-y-2">
      {newestFirst.map((e) => {
        const everyone = e.participants.length === group.members.length;
        const participantNames = everyone
          ? 'Todos'
          : e.participants.map((p) => nameOf.get(p.memberId) ?? '—').join(', ');
        return (
          <li key={e.id}>
            <a
              href={paths.expense(group.id, e.id)}
              className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-line transition hover:ring-ink/30 sm:p-4"
            >
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-paper text-2xl" aria-hidden>
                {getExpenseEmoji(e.description)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{e.description}</span>
                <span className="block truncate text-sm text-muted">
                  Pagó <strong className="font-semibold text-ink-soft">{nameOf.get(e.paidBy) ?? '—'}</strong> ·{' '}
                  {participantNames}
                </span>
              </span>
              <span className="tabular shrink-0 font-bold">{formatMoney(e.totalAmount)}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
