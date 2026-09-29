import { initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  runTransaction,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import type { Group } from '../types';
import type { GroupStore } from './GroupStore';

/**
 * GroupStore sobre Firestore: un documento por grupo en la colección `groups`.
 * - Lecturas en tiempo real con caché local (se puede ver el grupo sin señal).
 * - Las ediciones usan transacciones: se aplican sobre la última versión del
 *   grupo, así dos personas cargando gastos a la vez no se pisan.
 */
export function createFirestoreGroupStore(config: FirebaseOptions, emulatorHost?: string): GroupStore {
  const app = initializeApp(config);
  let db: Firestore;
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      ignoreUndefinedProperties: true,
    });
  } catch {
    // Navegadores sin IndexedDB: funciona igual, sin caché persistente.
    db = initializeFirestore(app, { ignoreUndefinedProperties: true });
  }
  if (emulatorHost) {
    const [host = 'localhost', port = '8080'] = emulatorHost.split(':');
    connectFirestoreEmulator(db, host, Number(port));
  }
  const groupRef = (id: string) => doc(db, 'groups', id);

  return {
    mode: 'cloud',
    watch(id, onChange, onError) {
      return onSnapshot(
        groupRef(id),
        (snap) => {
          if (snap.exists()) onChange(snap.data() as Group);
          // Sólo confiamos en "no existe" cuando lo confirma el servidor.
          else if (!snap.metadata.fromCache) onChange(null);
        },
        (error) => onError?.(error),
      );
    },
    async create(group) {
      // No esperamos al servidor: se ve al instante y se sube cuando haya conexión.
      setDoc(groupRef(group.id), group).catch((e) => console.error(e));
    },
    async update(id, transform) {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(groupRef(id));
        if (!snap.exists()) throw new Error('Este grupo ya no existe.');
        tx.set(groupRef(id), transform(snap.data() as Group));
      });
    },
    async remove(id) {
      deleteDoc(groupRef(id)).catch((e) => console.error(e));
    },
  };
}
