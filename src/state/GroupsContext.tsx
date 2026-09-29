import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Group } from '../types';
import type { GroupStore, StoreMode } from '../storage/GroupStore';
import { getGroupStore } from '../storage/createGroupStore';
import { loadMyGroupIds, saveMyGroupIds } from '../storage/groupsStorage';
import { Toast } from '../components/Toast';

/** undefined: cargando · null: no existe · Group: listo */
type GroupDocs = Record<string, Group | null | undefined>;

interface GroupsContextValue {
  mode: StoreMode | null;
  /** Grupos que este navegador creó o abrió. */
  myGroups: Group[];
  myGroupsLoading: boolean;
  docs: GroupDocs;
  myGroupIds: string[];
  /** Empieza a escuchar un grupo (aunque no sea "mío"). Devuelve la función para soltarlo. */
  retain: (id: string) => () => void;
  rememberGroup: (id: string) => void;
  /** Lo saca de "Mis grupos" en este navegador, sin borrarlo para los demás. */
  forgetGroup: (id: string) => void;
  createGroup: (group: Group) => Promise<boolean>;
  /** Aplica una transformación pura al grupo. Devuelve false (y avisa) si no se pudo guardar. */
  updateGroup: (id: string, update: (group: Group) => Group) => Promise<boolean>;
  /** Lo borra para todos. */
  deleteGroup: (id: string) => Promise<boolean>;
  /** Código para invitar (lo crea si hace falta). null si no se pudo. */
  ensureCode: (groupId: string) => Promise<string | null>;
  /** Id del grupo con ese código, null si no existe. Lanza error si no hay conexión. */
  findGroupIdByCode: (code: string) => Promise<string | null>;
}

const GroupsContext = createContext<GroupsContextValue | null>(null);

function errorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === 'unavailable' || (typeof navigator !== 'undefined' && !navigator.onLine))
    return 'Sin conexión: no se pudo guardar. Probá de nuevo cuando tengas señal.';
  if (code === 'permission-denied') return 'No se pudo guardar: permiso denegado. Revisá las reglas de Firestore.';
  if (error instanceof Error && error.message) return error.message;
  return 'No se pudo guardar. Probá de nuevo.';
}

export function GroupsProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<GroupStore | null>(null);
  const [myGroupIds, setMyGroupIds] = useState<string[]>(() => loadMyGroupIds());
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [docs, setDocs] = useState<GroupDocs>({});
  const [error, setError] = useState<string | null>(null);
  const subscriptions = useRef(new Map<string, () => void>());

  useEffect(() => {
    let cancelled = false;
    getGroupStore()
      .then((s) => {
        if (!cancelled) setStore(s);
      })
      .catch(() => setError('No se pudo conectar con la base de datos.'));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => saveMyGroupIds(myGroupIds), [myGroupIds]);

  // Suscribirse a cada grupo que nos interesa (mis grupos + el que esté abierto).
  const watchedIds = useMemo(() => [...new Set([...myGroupIds, ...extraIds])], [myGroupIds, extraIds]);
  useEffect(() => {
    if (!store) return;
    const subs = subscriptions.current;
    for (const id of watchedIds) {
      if (subs.has(id)) continue;
      subs.set(
        id,
        store.watch(
          id,
          (group) => setDocs((prev) => ({ ...prev, [id]: group })),
          (e) => setError(errorMessage(e)),
        ),
      );
    }
    for (const [id, unsubscribe] of subs) {
      if (!watchedIds.includes(id)) {
        unsubscribe();
        subs.delete(id);
      }
    }
  }, [store, watchedIds]);
  useEffect(() => {
    const subs = subscriptions.current;
    return () => {
      subs.forEach((unsubscribe) => unsubscribe());
      subs.clear();
    };
  }, []);

  // Si un grupo mío fue eliminado (por mí o por otra persona), sacarlo de la lista.
  useEffect(() => {
    const deleted = myGroupIds.filter((id) => docs[id] === null);
    if (deleted.length) setMyGroupIds((prev) => prev.filter((id) => !deleted.includes(id)));
  }, [docs, myGroupIds]);

  const retain = useCallback((id: string) => {
    setExtraIds((prev) => [...prev, id]);
    return () =>
      setExtraIds((prev) => {
        const i = prev.indexOf(id);
        return i === -1 ? prev : [...prev.slice(0, i), ...prev.slice(i + 1)];
      });
  }, []);

  const rememberGroup = useCallback(
    (id: string) => setMyGroupIds((prev) => (prev.includes(id) ? prev : [id, ...prev])),
    [],
  );
  const forgetGroup = useCallback((id: string) => setMyGroupIds((prev) => prev.filter((x) => x !== id)), []);

  const run = useCallback(async (operation: () => Promise<void>) => {
    try {
      await operation();
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    }
  }, []);

  const createGroup = useCallback(
    async (group: Group) => {
      if (!store) return false;
      const ok = await run(() => store.create(group));
      if (ok) {
        setDocs((prev) => ({ ...prev, [group.id]: group }));
        rememberGroup(group.id);
      }
      return ok;
    },
    [store, run, rememberGroup],
  );

  const updateGroup = useCallback(
    async (id: string, update: (group: Group) => Group) => (store ? run(() => store.update(id, update)) : false),
    [store, run],
  );

  const deleteGroup = useCallback(
    async (id: string) => {
      if (!store) return false;
      const ok = await run(() => store.remove(id));
      if (ok) forgetGroup(id);
      return ok;
    },
    [store, run, forgetGroup],
  );

  const ensureCode = useCallback(
    async (groupId: string) => {
      if (!store) return null;
      try {
        return await store.ensureCode(groupId);
      } catch (e) {
        setError(errorMessage(e));
        return null;
      }
    },
    [store],
  );

  const findGroupIdByCode = useCallback(
    async (code: string) => {
      const s = store ?? (await getGroupStore());
      return s.findGroupIdByCode(code);
    },
    [store],
  );

  const myGroups = useMemo(
    () => myGroupIds.map((id) => docs[id]).filter((g): g is Group => Boolean(g)),
    [myGroupIds, docs],
  );
  const myGroupsLoading = !store || myGroupIds.some((id) => docs[id] === undefined);

  const value = useMemo(
    () => ({
      mode: store?.mode ?? null,
      myGroups,
      myGroupsLoading,
      docs,
      myGroupIds,
      retain,
      rememberGroup,
      forgetGroup,
      createGroup,
      updateGroup,
      deleteGroup,
      ensureCode,
      findGroupIdByCode,
    }),
    [
      store,
      myGroups,
      myGroupsLoading,
      docs,
      myGroupIds,
      retain,
      rememberGroup,
      forgetGroup,
      createGroup,
      updateGroup,
      deleteGroup,
      ensureCode,
      findGroupIdByCode,
    ],
  );

  return (
    <GroupsContext.Provider value={value}>
      {children}
      <Toast message={error} onClose={() => setError(null)} />
    </GroupsContext.Provider>
  );
}

export function useGroups(): GroupsContextValue {
  const ctx = useContext(GroupsContext);
  if (!ctx) throw new Error('useGroups debe usarse dentro de <GroupsProvider>');
  return ctx;
}

export type GroupStatus = 'loading' | 'missing' | 'ready';

/**
 * Escucha un grupo por id (por ejemplo, uno abierto desde un link compartido)
 * y, cuando existe, lo agrega a "Mis grupos".
 */
export function useGroup(id: string): { group: Group | undefined; status: GroupStatus } {
  const { docs, retain, rememberGroup, myGroupIds } = useGroups();
  useEffect(() => retain(id), [id, retain]);

  const group = docs[id];
  const known = myGroupIds.includes(id);
  useEffect(() => {
    if (group && !known) rememberGroup(id);
  }, [group, known, id, rememberGroup]);

  if (group === undefined) return { group: undefined, status: 'loading' };
  if (group === null) return { group: undefined, status: 'missing' };
  return { group, status: 'ready' };
}
