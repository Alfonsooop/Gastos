import { useState, type FormEvent } from 'react';
import type { Expense, Group } from '../types';
import { Page } from '../components/Layout';
import { Button } from '../components/Button';
import { FieldError, TextField, inputClass } from '../components/Field';
import { MoneyInput } from '../components/MoneyInput';
import { DistributionEditor } from '../components/DistributionEditor';
import { AllocationStatus } from '../components/AllocationStatus';
import { useGroups } from '../state/GroupsContext';
import { useExpenseForm } from '../state/useExpenseForm';
import { navigate, paths } from '../state/router';
import { addExpense, updateExpense } from '../lib/groupOperations';
import { hasErrors } from '../lib/validation';
import { createId } from '../lib/id';
import { NotFoundPage } from './NotFoundPage';
import { GroupGate } from '../components/GroupGate';

const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2316181d' stroke-width='2' fill='none'/%3E%3C/svg%3E")`;

export function ExpenseFormPage({ groupId, expenseId }: { groupId: string; expenseId?: string }) {
  return (
    <GroupGate groupId={groupId}>
      {(group) => {
        const expense = expenseId ? group.expenses.find((e) => e.id === expenseId) : undefined;
        if (expenseId && !expense) return <NotFoundPage message="No encontramos este gasto." />;
        return <ExpenseForm key={expenseId ?? 'new'} group={group} expense={expense} />;
      }}
    </GroupGate>
  );
}

function ExpenseForm({ group, expense }: { group: Group; expense?: Expense }) {
  const { updateGroup } = useGroups();
  const form = useExpenseForm(group.members, expense);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const { errors, distribution } = form;
  const total = form.totalAmount ?? 0;
  const backTo = expense ? paths.expense(group.id, expense.id) : paths.group(group.id, 'gastos');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (hasErrors(errors) || saving) return;
    const draft = form.toDraft();
    // El id se genera acá, fuera de la transacción, para que un reintento no duplique el gasto.
    const newId = createId();
    const date = new Date().toISOString();
    setSaving(true);
    const ok = await updateGroup(group.id, (g) =>
      expense ? updateExpense(g, expense.id, draft) : addExpense(g, draft, newId, date),
    );
    setSaving(false);
    if (ok) navigate(expense ? paths.expense(group.id, expense.id) : paths.group(group.id, 'gastos'), { replace: true });
  };

  const showError = (field: keyof typeof errors) => (submitted ? errors[field] : undefined);

  return (
    <Page
      back={backTo}
      title={expense ? 'Editar gasto' : 'Nuevo gasto'}
      footer={
        <Button type="submit" form="expense-form" size="lg" disabled={saving} className="w-full shadow-lg shadow-ink/15">
          {saving ? 'Guardando…' : expense ? 'Guardar cambios' : 'Guardar gasto'}
        </Button>
      }
    >
      <form id="expense-form" onSubmit={onSubmit} noValidate className="space-y-6">
        <TextField
          label="Descripción"
          placeholder="Cena, bar, taxi…"
          value={form.description}
          onChange={form.setDescription}
          error={showError('description')}
          autoFocus={!expense}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="total" className="mb-1.5 block text-sm font-semibold">
              Monto total
            </label>
            <MoneyInput
              id="total"
              placeholder="0"
              value={form.totalAmount}
              onChange={form.setTotalAmount}
              aria-invalid={Boolean(showError('totalAmount'))}
              className={`${inputClass(Boolean(showError('totalAmount')))} px-0 text-lg font-bold`}
            />
            <FieldError>{showError('totalAmount')}</FieldError>
          </div>
          <div>
            <label htmlFor="paid-by" className="mb-1.5 block text-sm font-semibold">
              Pagó
            </label>
            <select
              id="paid-by"
              value={form.paidBy}
              onChange={(e) => form.setPaidBy(e.target.value)}
              style={{ backgroundImage: CHEVRON, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat' }}
              className={`${inputClass(Boolean(showError('paidBy')))} appearance-none pr-10 font-semibold`}
            >
              {!form.paidBy && <option value="">Elegí quién pagó</option>}
              {group.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <FieldError>{showError('paidBy')}</FieldError>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">¿Quiénes participaron?</p>
              <p className="text-xs text-muted">Se divide en partes iguales. Tocá un monto para cambiarlo y el resto se ajusta solo.</p>
            </div>
            {distribution.participants.length < group.members.length && (
              <Button variant="ghost" size="sm" onClick={form.selectAll} className="shrink-0">
                Todos
              </Button>
            )}
          </div>

          <DistributionEditor
            members={group.members}
            distribution={distribution}
            onToggle={form.toggleParticipant}
            onAmountChange={form.setCustomAmount}
            onUnlock={form.unlockAmount}
            onItemsChange={form.setItems}
          />
          <FieldError>{showError('participants')}</FieldError>

          {distribution.participants.length > 0 && (
            <div className="mt-3 space-y-2">
              <AllocationStatus total={total} distribution={distribution} />
              {submitted && errors.distribution && !distribution.issue && <FieldError>{errors.distribution}</FieldError>}
              {form.hasCustomAmounts && (
                <Button variant="secondary" size="sm" className="w-full" onClick={form.resetEqualSplit}>
                  ↺ Restablecer división equitativa
                </Button>
              )}
            </div>
          )}
        </div>
      </form>
    </Page>
  );
}
