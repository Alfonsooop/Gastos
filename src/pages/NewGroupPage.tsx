import { useRef, useState, type FormEvent } from 'react';
import { Page } from '../components/Layout';
import { Button } from '../components/Button';
import { FieldError, TextField, inputClass } from '../components/Field';
import { Avatar } from '../components/Avatar';
import { useGroups } from '../state/GroupsContext';
import { navigate, paths } from '../state/router';
import { createGroup } from '../lib/groupOperations';
import { hasErrors, validateGroupDraft } from '../lib/validation';

export function NewGroupPage() {
  const { createGroup: saveGroup } = useGroups();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberNames, setMemberNames] = useState<string[]>(['', '']);
  const [submitted, setSubmitted] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  const errors = validateGroupDraft(name, memberNames);

  const focusMember = (index: number) =>
    requestAnimationFrame(() => listRef.current?.querySelectorAll('input')[index]?.focus());

  const addMember = () => {
    setMemberNames((prev) => [...prev, '']);
    focusMember(memberNames.length);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (hasErrors(errors)) return;
    const group = createGroup({ name, description, memberNames });
    if (await saveGroup(group)) navigate(paths.group(group.id), { replace: true });
  };

  return (
    <Page back={paths.home()} title="Nuevo grupo">
      <form id="new-group" onSubmit={onSubmit} noValidate className="space-y-6">
        <TextField
          label="Nombre del grupo"
          placeholder="Salida con los pibes"
          value={name}
          onChange={setName}
          error={submitted ? errors.name : undefined}
          autoFocus
        />
        <TextField
          label="Descripción"
          hint="opcional"
          placeholder="Viernes 25/09"
          value={description}
          onChange={setDescription}
        />

        <div>
          <p className="mb-1.5 text-sm font-semibold">Integrantes</p>
          <ul ref={listRef} className="space-y-2">
            {memberNames.map((memberName, i) => (
              <li key={i} className="flex items-center gap-2">
                <Avatar name={memberName || '?'} />
                <input
                  className={inputClass()}
                  placeholder={`Persona ${i + 1}`}
                  value={memberName}
                  aria-label={`Nombre de la persona ${i + 1}`}
                  onChange={(e) => setMemberNames((prev) => prev.map((n, j) => (j === i ? e.target.value : n)))}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    if (i === memberNames.length - 1) addMember();
                    else focusMember(i + 1);
                  }}
                />
                <button
                  type="button"
                  aria-label="Quitar persona"
                  disabled={memberNames.length === 1}
                  onClick={() => setMemberNames((prev) => prev.filter((_, j) => j !== i))}
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-xl text-muted hover:bg-ink/5 disabled:opacity-30"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <FieldError>{submitted ? errors.members : undefined}</FieldError>
          <Button variant="secondary" className="mt-3 w-full" onClick={addMember}>
            + Agregar persona
          </Button>
        </div>

        <Button type="submit" size="lg" className="w-full">
          Crear grupo
        </Button>
      </form>
    </Page>
  );
}
