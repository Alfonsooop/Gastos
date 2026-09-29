import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Group } from '../types';
import { useGroups } from '../state/GroupsContext';
import { paths } from '../state/router';
import { Button } from './Button';

/** Botón "Invitar": muestra el código del grupo y permite compartir la invitación. */
export function InviteButton({ group }: { group: Group }) {
  const { ensureCode } = useGroups();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<string | null>(group.code ?? null);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const onOpen = async () => {
    setOpen(true);
    if (!code) setCode(await ensureCode(group.id));
  };

  const link = code ? `${window.location.origin}${window.location.pathname}${paths.join(code)}` : '';
  const message = `Sumate a "${group.name}" en Salda para dividir los gastos. Código: ${code}\n${link}`;

  const copy = async (what: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(what === 'code' ? (code ?? '') : message);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt('Copiá esto:', what === 'code' ? (code ?? '') : link);
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: group.name, text: message });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') void copy('link');
    }
  };

  return (
    <>
      <Button variant="accent" size="sm" onClick={onOpen}>
        Invitar
      </Button>
      {open &&
        // Portal: el header tiene backdrop-blur, que atraparía un `fixed` dentro suyo.
        createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal aria-label="Invitar al grupo">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="animate-rise safe-bottom relative w-full max-w-md rounded-t-3xl bg-card px-5 pt-6 text-center shadow-xl sm:mx-4 sm:rounded-3xl sm:pb-5">
            <h2 className="font-display text-xl font-bold">Invitá a tus amigos</h2>
            <p className="mt-1 text-sm text-muted">
              Con este código se unen desde “Unirme a un grupo” y pueden ver y cargar gastos.
            </p>
            <div className="mt-5 rounded-2xl bg-paper py-5">
              {code ? (
                <p className="font-display text-4xl font-extrabold tracking-[0.25em]" aria-label={`Código ${code.split('').join(' ')}`}>
                  {code}
                </p>
              ) : (
                <p className="py-2 text-sm text-muted">Generando código…</p>
              )}
            </div>
            <div className="mt-4 grid gap-2">
              {'share' in navigator && (
                <Button size="lg" disabled={!code} onClick={share}>
                  Compartir invitación
                </Button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" disabled={!code} onClick={() => copy('code')}>
                  {copied === 'code' ? '¡Copiado! ✓' : 'Copiar código'}
                </Button>
                <Button variant="secondary" disabled={!code} onClick={() => copy('link')}>
                  {copied === 'link' ? '¡Copiado! ✓' : 'Copiar link'}
                </Button>
              </div>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
