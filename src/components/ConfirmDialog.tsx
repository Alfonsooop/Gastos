import { useEffect, type ReactNode } from 'react';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Si es false, sólo se muestra el botón de cerrar (aviso sin acción). */
  canConfirm?: boolean;
  /** Acción alternativa no destructiva (ej: "Sólo quitarlo de mi lista"). */
  secondaryAction?: { label: string; onClick: () => void };
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  canConfirm = true,
  secondaryAction,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal aria-label={title}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="animate-rise safe-bottom relative w-full max-w-md rounded-t-3xl bg-card px-5 pt-6 shadow-xl sm:mx-4 sm:rounded-3xl sm:pb-5">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {children && <div className="mt-2 text-[15px] text-ink-soft">{children}</div>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel}>
            {canConfirm ? cancelLabel : 'Entendido'}
          </Button>
          {secondaryAction && (
            <Button variant="secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {canConfirm && (
            <Button variant="danger" onClick={onConfirm} autoFocus>
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
