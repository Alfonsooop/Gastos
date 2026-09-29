import { useSyncExternalStore } from 'react';

/** Evento de Chrome/Android que permite instalar la app con un toque. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

// Se registra al cargar la app: el evento puede llegar antes de que se monte React.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    notify();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Si el navegador permite instalar con un toque, devuelve la función para hacerlo. */
export function useInstallPrompt() {
  const canInstall = useSyncExternalStore(subscribe, () => deferred !== null, () => false);
  const justInstalled = useSyncExternalStore(subscribe, () => installed, () => false);

  const install = async (): Promise<boolean> => {
    if (!deferred) return false;
    const event = deferred;
    deferred = null;
    notify();
    await event.prompt();
    return (await event.userChoice).outcome === 'accepted';
  };

  return { canInstall, justInstalled, install };
}
