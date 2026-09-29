import type { Group } from '../types';

const STORAGE_KEY = 'salda:groups:v1';

interface StoredData {
  version: 1;
  groups: Group[];
}

function isGroupArray(value: unknown): value is Group[] {
  return (
    Array.isArray(value) &&
    value.every(
      (g) =>
        typeof g === 'object' &&
        g !== null &&
        typeof g.id === 'string' &&
        Array.isArray(g.members) &&
        Array.isArray(g.expenses),
    )
  );
}

export function loadGroups(storage: Storage | undefined = globalThis.localStorage): Group[] {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Partial<StoredData>;
    return isGroupArray(data.groups) ? data.groups : [];
  } catch {
    return [];
  }
}

export function saveGroups(groups: Group[], storage: Storage | undefined = globalThis.localStorage): void {
  try {
    const data: StoredData = { version: 1, groups };
    storage?.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Sin espacio o almacenamiento bloqueado: la app sigue funcionando en memoria.
  }
}
