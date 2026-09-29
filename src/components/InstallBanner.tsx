import { useState } from 'react';
import { isRunningAsInstalledApp } from '../lib/platform';
import { useInstallPrompt } from '../state/installPrompt';
import { InstallGuide } from './InstallGuide';

const DISMISSED_KEY = 'salda:install-banner-dismissed';

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Invitación a agregar Salda a la pantalla de inicio. No aparece si la app ya
 * se abrió desde el acceso directo o si la persona la cerró.
 * `compact`: una línea, para usar dentro de un grupo.
 */
export function InstallBanner({ compact = false }: { compact?: boolean }) {
  const [dismissed, setDismissed] = useState(wasDismissed);
  const [open, setOpen] = useState(false);
  const { justInstalled } = useInstallPrompt();

  if (dismissed || justInstalled || isRunningAsInstalledApp()) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Sin almacenamiento: se oculta sólo por ahora.
    }
    setDismissed(true);
  };

  return (
    <>
      <div
        className={`flex items-center gap-3 rounded-3xl bg-card ring-1 ring-line ${compact ? 'px-3 py-2.5' : 'px-4 py-4'}`}
      >
        <span className={compact ? 'text-xl' : 'text-3xl'} aria-hidden>
          📲
        </span>
        <button type="button" onClick={() => setOpen(true)} className="min-w-0 flex-1 text-left">
          <p className="font-semibold">{compact ? 'Agregá Salda a tu celular' : 'Tené Salda a mano en tu celular'}</p>
          {!compact && <p className="text-sm text-muted">Te mostramos cómo dejarla en tu pantalla de inicio, en 3 pasos.</p>}
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-xl bg-lime px-3 py-1.5 text-sm font-semibold"
        >
          Ver cómo
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="No mostrar más"
          className="-mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-lg text-muted hover:bg-ink/5"
        >
          ×
        </button>
      </div>
      {open && <InstallGuide onClose={() => setOpen(false)} />}
    </>
  );
}
