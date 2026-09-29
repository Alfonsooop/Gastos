import { useState } from 'react';
import { Page } from '../components/Layout';
import { Button, LinkButton } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useGroups } from '../state/GroupsContext';
import { navigate, paths } from '../state/router';
import { deleteExpense } from '../lib/groupOperations';
import { calculateTotalAssigned } from '../lib/distribution';
import { formatMoney } from '../lib/money';
import { getExpenseEmoji } from '../lib/expenseEmoji';
import { NotFoundPage } from './NotFoundPage';
import { GroupGate } from '../components/GroupGate';
import type { ExpenseParticipant, Group } from '../types';

const dateFormat = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

export function ExpenseDetailPage({ groupId, expenseId }: { groupId: string; expenseId: string }) {
  return <GroupGate groupId={groupId}>{(group) => <ExpenseDetail group={group} expenseId={expenseId} />}</GroupGate>;
}

function ExpenseDetail({ group, expenseId }: { group: Group; expenseId: string }) {
  const { updateGroup } = useGroups();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const expense = group.expenses.find((e) => e.id === expenseId);

  if (deleting) return null;
  if (!expense) return <NotFoundPage message="No encontramos este gasto." />;

  const nameOf = new Map(group.members.map((m) => [m.id, m.name]));
  const assigned = calculateTotalAssigned(expense.participants);
  const payer = nameOf.get(expense.paidBy) ?? '—';

  return (
    <Page back={paths.group(group.id, 'gastos')} title={group.name}>
      <div className="animate-rise">
        <div className="flex items-start gap-4">
          <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-3xl bg-card text-4xl ring-1 ring-line" aria-hidden>
            {getExpenseEmoji(expense.description)}
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-3xl font-extrabold tracking-tight break-words">{expense.description}</h2>
            <p className="text-sm text-muted">{dateFormat.format(new Date(expense.date))}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-ink px-4 py-3 text-white">
            <p className="text-[11px] font-semibold tracking-wide text-lime uppercase">Total</p>
            <p className="tabular font-display text-2xl font-bold">{formatMoney(expense.totalAmount)}</p>
          </div>
          <div className="rounded-2xl bg-card px-4 py-3 ring-1 ring-line">
            <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Pagó</p>
            <p className="flex items-center gap-2 truncate font-display text-2xl font-bold">
              <Avatar name={payer} size="sm" /> {payer}
            </p>
          </div>
        </div>

        <h3 className="mt-8 mb-3 font-display text-xl font-bold">Distribución</h3>
        <div className="overflow-hidden rounded-3xl bg-card ring-1 ring-line">
          <ul className="divide-y divide-line">
            {expense.participants.map((p) => (
              <ParticipantRow key={p.memberId} name={nameOf.get(p.memberId) ?? '—'} participant={p} />
            ))}
          </ul>
          <div className="flex items-center justify-between bg-plus-soft px-4 py-3 font-semibold text-plus">
            <span>Total asignado</span>
            <span className="tabular">
              {formatMoney(assigned)} {assigned === expense.totalAmount && '✓'}
            </span>
          </div>
        </div>
        <p className="mt-2 px-1 text-xs text-muted">
          {payer} adelantó {formatMoney(expense.totalAmount)}. Los montos automáticos reparten en partes iguales lo que no fue
          personalizado.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <LinkButton href={paths.editExpense(group.id, expense.id)} variant="primary">
            ✎ Editar
          </LinkButton>
          <Button variant="secondary" className="text-minus" onClick={() => setConfirmDelete(true)}>
            🗑 Eliminar
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="¿Seguro que querés eliminar este gasto?"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          setDeleting(true);
          if (await updateGroup(group.id, (g) => deleteExpense(g, expense.id)))
            navigate(paths.group(group.id, 'gastos'), { replace: true });
          else setDeleting(false);
        }}
      >
        Se va a borrar <strong>{expense.description}</strong> ({formatMoney(expense.totalAmount)}) y se recalculan los balances
        del grupo.
      </ConfirmDialog>
    </Page>
  );
}

/** Fila de la distribución. Si la persona tiene detalle, la flecha lo despliega. */
function ParticipantRow({ name, participant: p }: { name: string; participant: ExpenseParticipant }) {
  const [open, setOpen] = useState(false);
  const items = p.items ?? [];
  const hasItems = items.length > 0;

  const summary = (
    <>
      <Avatar name={name} size="sm" />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate font-semibold">{name}</span>
        {hasItems && (
          <span className="block text-xs text-muted">
            {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
          </span>
        )}
      </span>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${hasItems ? 'hidden sm:inline' : ''} ${p.isCustom ? 'bg-lime-soft text-ink' : 'bg-ink/5 text-muted'}`}
      >
        {hasItems ? '🧾 detallado' : p.isCustom ? '🔒 personalizado' : 'automático'}
      </span>
      <span className="tabular w-24 text-right font-semibold sm:w-28">{formatMoney(p.amount)}</span>
    </>
  );

  if (!hasItems) return <li className="flex items-center gap-3 px-4 py-3">{summary}</li>;

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`${open ? 'Ocultar' : 'Ver'} lo que consumió ${name}`}
        className="flex w-full items-center gap-3 py-3 pr-4 pl-2 hover:bg-paper/60"
      >
        <svg viewBox="0 0 20 20" className={`size-4 shrink-0 text-muted transition-transform ${open ? 'rotate-90' : ''}`} fill="currentColor" aria-hidden>
          <path d="M7 4l7 6-7 6z" />
        </svg>
        {summary}
      </button>
      {open && (
        <ul className="mx-4 mb-3 space-y-1 rounded-2xl bg-paper px-4 py-2.5 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span className="text-ink-soft">{item.description || 'Sin descripción'}</span>
              <span className="tabular font-medium">{formatMoney(item.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
