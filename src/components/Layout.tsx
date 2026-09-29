import type { ReactNode } from 'react';
import { paths } from '../state/router';

export function Logo({ size = 'md' }: { size?: 'md' | 'xl' }) {
  const big = size === 'xl';
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center justify-center rounded-xl bg-ink font-display font-extrabold text-lime ${big ? 'size-14 rounded-2xl text-3xl' : 'size-8 text-lg'}`}
      >
        S
      </span>
      <span className={`font-display font-extrabold tracking-tight ${big ? 'text-5xl' : 'text-xl'}`}>Salda</span>
    </span>
  );
}

interface PageProps {
  children: ReactNode;
  /** Link del botón "volver". Si no se pasa, se muestra el logo. */
  back?: string;
  title?: string;
  actions?: ReactNode;
  /** Barra fija inferior (botón principal en celular). */
  footer?: ReactNode;
}

export function Page({ children, back, title, actions, footer }: PageProps) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4">
          {back ? (
            <a
              href={back}
              aria-label="Volver"
              className="-ml-2 inline-flex size-10 items-center justify-center rounded-full text-xl hover:bg-ink/5"
            >
              ←
            </a>
          ) : (
            <a href={paths.home()} aria-label="Inicio">
              <Logo />
            </a>
          )}
          {title && <h1 className="min-w-0 flex-1 truncate font-display text-lg font-bold">{title}</h1>}
          {!title && <div className="flex-1" />}
          {actions}
        </div>
      </header>
      <main className={`mx-auto max-w-2xl px-4 pt-5 ${footer ? 'pb-32' : 'pb-12'}`}>{children}</main>
      {footer && (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-paper via-paper/95 to-paper/0 pt-6">
          <div className="mx-auto max-w-2xl px-4">{footer}</div>
        </div>
      )}
    </div>
  );
}
