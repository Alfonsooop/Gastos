import type { Group } from '../types';
import type { GroupStore } from './GroupStore';
import { loadGroups, saveGroups } from './groupsStorage';
import { generateGroupCode } from '../lib/groupCode';

type Listener = (group: Group | null) => void;

/** GroupStore sobre localStorage. Los cambios se ven al instante (y entre pestañas). */
export function createLocalGroupStore(storage: Storage | undefined = globalThis.localStorage): GroupStore {
  let groups = new Map(loadGroups(storage).map((g) => [g.id, g]));
  const listeners = new Map<string, Set<Listener>>();

  const emit = (id: string) => listeners.get(id)?.forEach((cb) => cb(groups.get(id) ?? null));
  const persist = () => saveGroups([...groups.values()], storage);

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', () => {
      groups = new Map(loadGroups(storage).map((g) => [g.id, g]));
      listeners.forEach((_, id) => emit(id));
    });
  }

  const store: GroupStore = {
    mode: 'local',
    watch(id, onChange) {
      const set = listeners.get(id) ?? new Set<Listener>();
      set.add(onChange);
      listeners.set(id, set);
      onChange(groups.get(id) ?? null);
      return () => set.delete(onChange);
    },
    async create(group) {
      groups = new Map([[group.id, group], ...groups]);
      persist();
      emit(group.id);
    },
    async update(id, transform) {
      const current = groups.get(id);
      if (!current) throw new Error('Este grupo ya no existe.');
      groups.set(id, transform(current));
      persist();
      emit(id);
    },
    async remove(id) {
      groups.delete(id);
      persist();
      emit(id);
    },
    async ensureCode(groupId) {
      const group = groups.get(groupId);
      if (!group) throw new Error('Este grupo ya no existe.');
      if (group.code) return group.code;
      const used = new Set([...groups.values()].map((g) => g.code));
      let code = generateGroupCode();
      while (used.has(code)) code = generateGroupCode();
      await store.update(groupId, (g) => ({ ...g, code }));
      return code;
    },
    async findGroupIdByCode(code) {
      return [...groups.values()].find((g) => g.code === code)?.id ?? null;
    },
  };
  return store;
}
