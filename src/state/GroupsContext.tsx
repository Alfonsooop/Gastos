import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Group } from '../types';
import { loadGroups, saveGroups } from '../storage/groupsStorage';

interface GroupsContextValue {
  groups: Group[];
  getGroup: (id: string) => Group | undefined;
  saveGroup: (group: Group) => void;
  /** Aplica una transformación pura al grupo indicado. */
  updateGroup: (id: string, update: (group: Group) => Group) => void;
  deleteGroup: (id: string) => void;
}

const GroupsContext = createContext<GroupsContextValue | null>(null);

export function GroupsProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>(() => loadGroups());

  useEffect(() => saveGroups(groups), [groups]);

  // Mantener sincronizadas varias pestañas abiertas.
  useEffect(() => {
    const onStorage = () => setGroups(loadGroups());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const getGroup = useCallback((id: string) => groups.find((g) => g.id === id), [groups]);

  const saveGroup = useCallback((group: Group) => {
    setGroups((prev) =>
      prev.some((g) => g.id === group.id) ? prev.map((g) => (g.id === group.id ? group : g)) : [group, ...prev],
    );
  }, []);

  const updateGroup = useCallback((id: string, update: (group: Group) => Group) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? update(g) : g)));
  }, []);

  const deleteGroup = useCallback((id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const value = useMemo(
    () => ({ groups, getGroup, saveGroup, updateGroup, deleteGroup }),
    [groups, getGroup, saveGroup, updateGroup, deleteGroup],
  );
  return <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>;
}

export function useGroups(): GroupsContextValue {
  const ctx = useContext(GroupsContext);
  if (!ctx) throw new Error('useGroups debe usarse dentro de <GroupsProvider>');
  return ctx;
}
