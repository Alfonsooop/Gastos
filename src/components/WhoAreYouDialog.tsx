import { createPortal } from 'react-dom';
import { useState, type FormEvent } from 'react';
import type { Group } from '../types';
import { useGroups } from '../state/GroupsContext';
import { addMember } from '../lib/groupOperations';
import { createId } from '../lib/id';
import { validateMemberName } from '../lib/validation';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { FieldError, inputClass } from './Field';

interface WhoAreYouDialogProps {
  group: Group;
  onSelect: (memberId: string) => void;
  onSkip: () => void;
}

/** "¿Quién sos?": para mostrarle a cada uno cuánto debe y a quién. */
export function WhoAreYouDialog({ group, onSelect, onSkip }: WhoAreYouDialogProps) {
  const { updateGroup } = useGroups();
  const [adding, setAdding] = useState(group.members.length === 0);
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const addMe = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validateMemberName(name, group.members);
    setError(problem);
    if (problem) return;
    const id = createId();
    setSaving(true);
    const ok = await updateGroup(group.id, (g) => addMember(g, name, id));
    setSaving(false);
    if (ok) onSelect(id);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal aria-label="¿Quién sos?">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" />
      <div className="animate-rise safe-bottom relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card px-5 pt-6 shadow-xl sm:mx-4 sm:rounded-3xl sm:pb-5">
        <h2 className="font-display text-xl font-bold">¿Quién sos en “{group.name}”?</h2>
        <p className="mt-1 text-sm text-muted">Así te mostramos cuánto tenés que pagar y a quién.</p>

        {!adding ? (
          <>
            <ul className="mt-4 grid grid-cols-2 gap-2">
              {group.members.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(m.id)}
                    className="flex w-full items-center gap-2.5 rounded-2xl bg-paper px-3 py-3 text-left font-semibold ring-1 ring-line transition hover:ring-ink"
                  >
                    <Avatar name={m.name} size="sm" />
                    <span className="truncate">{m.name}</span>
                  </button>
                </li>
              ))}
            </ul>
            <Button variant="secondary" className="mt-3 w-full" onClick={() => setAdding(true)}>
              No estoy en la lista
            </Button>
          </>
        ) : (
          <form onSubmit={addMe} noValidate className="mt-4">
            <input
              autoFocus
              aria-label="Tu nombre"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(undefined);
              }}
              className={inputClass(Boolean(error))}
            />
            <FieldError>{error}</FieldError>
            <Button type="submit" className="mt-3 w-full" disabled={saving}>
              {saving ? 'Agregando…' : 'Agregarme al grupo'}
            </Button>
            {group.members.length > 0 && (
              <Button variant="ghost" className="mt-1 w-full" onClick={() => setAdding(false)}>
                Volver a la lista
              </Button>
            )}
          </form>
        )}
        <Button variant="ghost" size="sm" className="mt-2 w-full text-muted" onClick={onSkip}>
          Ahora no
        </Button>
      </div>
    </div>,
    document.body,
  );
}
