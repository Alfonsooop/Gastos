import { firebaseConfig } from '../firebase/config';
import type { GroupStore } from './GroupStore';
import { createLocalGroupStore } from './localGroupStore';
import { takeGroupsToMigrate } from './groupsStorage';

let storePromise: Promise<GroupStore> | null = null;

/**
 * Devuelve el store de la app (uno solo, aunque se llame varias veces).
 * Usa Firestore si está configurado; si no, localStorage. Firebase se carga sólo si hace falta.
 */
export function getGroupStore(): Promise<GroupStore> {
  storePromise ??= createGroupStore();
  return storePromise;
}

async function createGroupStore(): Promise<GroupStore> {
  if (!firebaseConfig) return createLocalGroupStore();
  const { createFirestoreGroupStore } = await import('./firestoreGroupStore');
  const store = createFirestoreGroupStore(firebaseConfig, import.meta.env.VITE_FIRESTORE_EMULATOR_HOST);
  // La primera vez con nube, subimos los grupos que había guardados en el navegador.
  await Promise.all(takeGroupsToMigrate().map((g) => store.create(g)));
  return store;
}
