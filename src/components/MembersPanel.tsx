import { useState, type FormEvent } from 'react';
import type { Group, Member, MemberBalance } from '../types';
import { useGroups } from '../state/GroupsContext';
import { addMember, getMemberUsage, removeMember } from '../lib/groupOperations';
import { validateMemberName } from '../lib/validation';
import { formatSignedMoney } from '../lib/money';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { SectionTitle } from './Card';
import { ConfirmDialog } from './ConfirmDialog';
import { FieldError, inputClass } from './Field';

export function MembersPanel({ group, balances }: { group: Group; balances: MemberBalance[] }) {
  const { updateGroup } = useGroups();
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const [toRemove, setToRemove] = useState<Member | null>(null);

  const balanceOf = new Map(balances.map((b) => [b.memberId, b.balance]));
  const usage = toRemove ? getMemberUsage(group, toRemove.id) : null;
  const blocked = Boolean(usage && usage.paidCount > 0);

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validateMemberName(name, group.members);
    setError(problem);
    if (problem) return;
    const newName = name;
    setName('');
    if (!(await updateGroup(group.id, (g) => addMember(g, newName)))) setName(newName);
  };

  return (
    <section>
      <SectionTitle>Integrantes</SectionTitle>

      <form onSubmit={onAdd} noValidate className="mb-4">
        <div className="flex gap-2">
          <input
            className={inputClass(Boolean(error))}
            placeholder="Nombre de la persona"
            aria-label="Nombre de la nueva persona"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(undefined);
            }}
          />
          <Button type="submit" className="h-12 shrink-0">
            + Agregar persona
          </Button>
        </div>
        <FieldError>{error}</FieldError>
      </form>

      {group.members.length === 0 ? (
        <p className="text-center text-muted">Todavía no hay integrantes.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-card ring-1 ring-line">
          {group.members.map((m) => {
            const balance = balanceOf.get(m.id) ?? 0;
            return (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={m.name} />
                <span className="min-w-0 flex-1 truncate font-semibold">{m.name}</span>
                <span
                  className={`tabular text-sm font-semibold ${balance > 0 ? 'text-plus' : balance < 0 ? 'text-minus' : 'text-muted'}`}
                >
                  {formatSignedMoney(balance)}
                </span>
                <button
                  type="button"
                  onClick={() => setToRemove(m)}
                  aria-label={`Eliminar a ${m.name}`}
                  className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-minus-soft hover:text-minus"
                >
                  🗑
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={toRemove !== null}
        title={blocked ? `No se puede eliminar a ${toRemove?.name}` : `¿Eliminar a ${toRemove?.name}?`}
        canConfirm={!blocked}
        confirmLabel="Eliminar persona"
        onCancel={() => setToRemove(null)}
        onConfirm={() => {
          if (toRemove) updateGroup(group.id, (g) => removeMember(g, toRemove.id));
          setToRemove(null);
        }}
      >
        {usage && blocked && (
          <p>
            {toRemove?.name} pagó {usage.paidCount === 1 ? '1 gasto' : `${usage.paidCount} gastos`}. Cambiá quién pagó o
            eliminá esos gastos antes de quitar a esta persona, así no se pierde ese dinero en las cuentas.
          </p>
        )}
        {usage && !blocked && usage.participatesCount > 0 && (
          <div className="space-y-2">
            <p className="rounded-2xl bg-warn-soft px-3 py-2 font-medium text-warn">
              ⚠ Esta persona participa en gastos existentes. Eliminarla podría afectar los balances del grupo.
            </p>
            <p>
              Participa en {usage.participatesCount === 1 ? '1 gasto' : `${usage.participatesCount} gastos`}: su parte se va a
              repartir entre el resto de los participantes.
              {usage.soleParticipantCount > 0 &&
                ` ${usage.soleParticipantCount === 1 ? '1 gasto donde era la única persona se va a eliminar' : `${usage.soleParticipantCount} gastos donde era la única persona se van a eliminar`}.`}
            </p>
          </div>
        )}
        {usage && !blocked && usage.participatesCount === 0 && <p>No participa de ningún gasto, así que los balances no cambian.</p>}
      </ConfirmDialog>
    </section>
  );
}
