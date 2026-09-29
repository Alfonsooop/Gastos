import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Page } from '../components/Layout';
import { Button } from '../components/Button';
import { FieldError, inputClass } from '../components/Field';
import { useGroups } from '../state/GroupsContext';
import { navigate, paths } from '../state/router';
import { GROUP_CODE_LENGTH, isValidGroupCode, normalizeGroupCode } from '../lib/groupCode';

export function JoinPage({ initialCode }: { initialCode: string }) {
  const { findGroupIdByCode, rememberGroup } = useGroups();
  const [code, setCode] = useState(normalizeGroupCode(initialCode));
  const [error, setError] = useState<string>();
  const [searching, setSearching] = useState(false);
  const autoJoined = useRef(false);

  const join = async (value: string) => {
    const normalized = normalizeGroupCode(value);
    if (!isValidGroupCode(normalized)) {
      setError(`El código tiene ${GROUP_CODE_LENGTH} letras y números, por ejemplo K7P2QX.`);
      return;
    }
    setError(undefined);
    setSearching(true);
    try {
      const groupId = await findGroupIdByCode(normalized);
      if (!groupId) {
        setError('No encontramos ningún grupo con ese código. Revisá que esté bien escrito.');
        return;
      }
      rememberGroup(groupId);
      navigate(paths.group(groupId), { replace: true });
    } catch {
      setError('No pudimos buscar el grupo. Revisá tu conexión y probá de nuevo.');
    } finally {
      setSearching(false);
    }
  };

  // Si se llegó con un link de invitación (#/unirse/K7P2QX), unirse directamente.
  useEffect(() => {
    if (autoJoined.current || !isValidGroupCode(normalizeGroupCode(initialCode))) return;
    autoJoined.current = true;
    void join(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void join(code);
  };

  return (
    <Page back={paths.home()} title="Unirme a un grupo">
      <form onSubmit={onSubmit} noValidate className="mx-auto max-w-sm pt-6 text-center">
        <span className="text-5xl" aria-hidden>
          🤝
        </span>
        <p className="mt-4 font-display text-2xl font-bold">Escribí el código del grupo</p>
        <p className="mt-1 text-sm text-muted">Pediselo a quien creó el grupo. Lo encuentra tocando “Invitar”.</p>
        <input
          aria-label="Código del grupo"
          autoFocus
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={GROUP_CODE_LENGTH + 2}
          placeholder="K7P2QX"
          value={code}
          onChange={(e) => {
            setCode(normalizeGroupCode(e.target.value));
            setError(undefined);
          }}
          className={`${inputClass(Boolean(error))} mt-6 h-16 text-center font-display text-3xl font-bold tracking-[0.3em] uppercase placeholder:tracking-[0.3em]`}
        />
        <FieldError>{error}</FieldError>
        <Button type="submit" size="lg" className="mt-4 w-full" disabled={searching}>
          {searching ? 'Buscando…' : 'Unirme'}
        </Button>
      </form>
    </Page>
  );
}
