import { initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
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
import { generateGroupCode } from '../lib/groupCode';

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
  /** codes/{código} → { groupId }: permite unirse escribiendo el código. */
  const codeRef = (code: string) => doc(db, 'codes', code);

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
    async ensureCode(groupId) {
      // Transacción: si dos personas tocan "Invitar" a la vez, queda un solo código.
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateGroupCode();
        const code = await runTransaction(db, async (tx) => {
          const snap = await tx.get(groupRef(groupId));
          if (!snap.exists()) throw new Error('Este grupo ya no existe.');
          const existing = (snap.data() as Group).code;
          if (existing) return existing;
          if ((await tx.get(codeRef(candidate))).exists()) return null; // código ocupado: probar otro
          tx.set(codeRef(candidate), { groupId });
          tx.update(groupRef(groupId), { code: candidate });
          return candidate;
        });
        if (code) return code;
      }
      throw new Error('No se pudo generar el código. Probá de nuevo.');
    },
    async findGroupIdByCode(code) {
      const snap = await getDoc(codeRef(code));
      return snap.exists() ? (snap.data() as { groupId: string }).groupId : null;
    },
  };
}
