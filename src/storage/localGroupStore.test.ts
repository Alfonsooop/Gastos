import { describe, expect, it, vi } from 'vitest';
import { createLocalGroupStore } from './localGroupStore';
import { loadGroups, loadMyGroupIds, saveGroups, saveMyGroupIds, takeGroupsToMigrate } from './groupsStorage';
import { addMember, createGroup } from '../lib/groupOperations';
import type { Group } from '../types';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  };
}

const newGroup = (name: string): Group => createGroup({ name, description: '', memberNames: ['Ana'] });

describe('createLocalGroupStore', () => {
  it('crea, actualiza, avisa a los que escuchan y persiste', async () => {
    const storage = memoryStorage();
    const store = createLocalGroupStore(storage);
    const group = newGroup('Viaje');
    const onChange = vi.fn();

    store.watch(group.id, onChange);
    expect(onChange).toHaveBeenLastCalledWith(null);

    await store.create(group);
    await store.update(group.id, (g) => addMember(g, 'Beto'));
    expect(onChange.mock.lastCall?.[0].members.map((m: { name: string }) => m.name)).toEqual(['Ana', 'Beto']);
    expect(loadGroups(storage)[0]?.members).toHaveLength(2);

    await store.remove(group.id);
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(loadGroups(storage)).toEqual([]);
  });

  it('falla al editar un grupo que no existe', async () => {
    await expect(createLocalGroupStore(memoryStorage()).update('nope', (g) => g)).rejects.toThrow();
  });

  it('deja de avisar después de desuscribirse', async () => {
    const store = createLocalGroupStore(memoryStorage());
    const group = newGroup('Cena');
    const onChange = vi.fn();
    const unsubscribe = store.watch(group.id, onChange);
    unsubscribe();
    await store.create(group);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('mis grupos y migración', () => {
  it('la primera vez toma los grupos locales existentes', () => {
    const storage = memoryStorage();
    const [a, b] = [newGroup('A'), newGroup('B')];
    saveGroups([a, b], storage);
    expect(loadMyGroupIds(storage)).toEqual([a.id, b.id]);
    saveMyGroupIds([b.id], storage);
    expect(loadMyGroupIds(storage)).toEqual([b.id]);
  });

  it('los grupos locales se migran a la nube una sola vez', () => {
    const storage = memoryStorage();
    saveGroups([newGroup('A')], storage);
    expect(takeGroupsToMigrate(storage)).toHaveLength(1);
    expect(takeGroupsToMigrate(storage)).toHaveLength(0);
  });
});
