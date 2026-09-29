import { useEffect } from 'react';

export function Toast({ message, onClose }: { message: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-4">
      <div
        role="alert"
        className="animate-rise pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-xl"
      >
        <span>⚠</span>
        <p className="flex-1">{message}</p>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="text-white/70 hover:text-white">
          ×
        </button>
      </div>
    </div>
  );
}
