import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { detectPlatform, type Platform } from '../lib/platform';
import { useInstallPrompt } from '../state/installPrompt';
import { Button } from './Button';

type Tab = Exclude<Platform, 'desktop'>;

/** Ícono "Compartir" de iPhone (cuadrado con flecha hacia arriba). */
const ShareIcon = () => (
  <svg viewBox="0 0 24 24" className="inline size-5 -translate-y-0.5 text-[#0a84ff]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Compartir">
    <path d="M12 3v12M8 7l4-4 4 4" />
    <path d="M7 10H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1" />
  </svg>
);

/** Ícono "Agregar a inicio" (cuadrado con +). */
const AddIcon = () => (
  <svg viewBox="0 0 24 24" className="inline size-5 -translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

/** Menú de tres puntos de Chrome en Android. */
const MenuIcon = () => (
  <span className="inline-flex h-5 w-4 -translate-y-0.5 flex-col items-center justify-center gap-[3px] align-middle" aria-label="menú de tres puntos">
    {[0, 1, 2].map((i) => (
      <span key={i} className="size-[3.5px] rounded-full bg-ink" />
    ))}
  </span>
);

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-lime font-display text-sm font-bold">
        {n}
      </span>
      <p className="pt-0.5 text-[15px] leading-snug">{children}</p>
    </li>
  );
}

function IosSteps({ browser }: { browser: 'safari' | 'chrome' | 'other' }) {
  if (browser === 'other') {
    return (
      <p className="rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn">
        Este navegador no deja agregar accesos directos. Copiá el link, abrilo en <strong>Safari</strong> y seguí estos pasos.
      </p>
    );
  }
  return (
    <ol className="space-y-4">
      <Step n={1}>
        Tocá <strong>Compartir</strong> <ShareIcon />{' '}
        {browser === 'chrome' ? 'arriba a la derecha, en la barra de direcciones.' : 'en la barra de abajo de Safari.'}
      </Step>
      <Step n={2}>
        Deslizá hacia abajo y elegí <strong>Agregar a inicio</strong> <AddIcon />.
      </Step>
      <Step n={3}>
        Tocá <strong>Agregar</strong>, arriba a la derecha. ¡Listo! Salda aparece en tu pantalla como una app más.
      </Step>
    </ol>
  );
}

function AndroidSteps() {
  return (
    <ol className="space-y-4">
      <Step n={1}>
        En Chrome, tocá el menú <MenuIcon /> arriba a la derecha.
      </Step>
      <Step n={2}>
        Elegí <strong>Agregar a la pantalla principal</strong> (en algunos teléfonos dice <strong>Instalar app</strong>).
      </Step>
      <Step n={3}>
        Confirmá con <strong>Agregar</strong> o <strong>Instalar</strong>. ¡Listo! Salda aparece junto a tus apps.
      </Step>
    </ol>
  );
}

/** Mini tutorial para dejar Salda como acceso directo en el celular. */
export function InstallGuide({ onClose }: { onClose: () => void }) {
  const info = detectPlatform(navigator.userAgent, navigator.maxTouchPoints);
  const [tab, setTab] = useState<Tab>(info.platform === 'android' ? 'android' : 'ios');
  const { canInstall, install } = useInstallPrompt();
  const isDesktop = info.platform === 'desktop';

  const installNow = async () => {
    if (await install()) onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal aria-label="Agregar Salda al celular">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-rise safe-bottom relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card px-5 pt-6 shadow-xl sm:mx-4 sm:rounded-3xl sm:pb-5">
        <div className="flex items-center gap-3">
          <img src="icon-192.png" alt="" className="size-12 rounded-2xl" />
          <div>
            <h2 className="font-display text-xl font-bold">Tené Salda a mano</h2>
            <p className="text-sm text-muted">Agregala a tu pantalla de inicio y abrila como una app.</p>
          </div>
        </div>

        {canInstall && (
          <Button size="lg" className="mt-5 w-full" onClick={installNow}>
            📲 Instalar Salda
          </Button>
        )}

        {isDesktop && (
          <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm text-ink-soft">
            Abrí este link en tu celular y seguí los pasos según tu teléfono.
          </p>
        )}

        {(!canInstall || isDesktop) && (
          <>
            <div className="mt-5 flex gap-1 rounded-2xl bg-ink/5 p-1" role="tablist">
              {(['ios', 'android'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${tab === t ? 'bg-card shadow-sm' : 'text-muted'}`}
                >
                  {t === 'ios' ? 'iPhone' : 'Android'}
                </button>
              ))}
            </div>
            <div className="mt-5">
              {tab === 'ios' ? <IosSteps browser={info.platform === 'ios' ? info.browser : 'safari'} /> : <AndroidSteps />}
            </div>
          </>
        )}

        <Button variant="ghost" className="mt-5 w-full" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>,
    document.body,
  );
}
