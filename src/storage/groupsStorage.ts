import type { Group } from '../types';

const GROUPS_KEY = 'salda:groups:v1';
const MY_GROUPS_KEY = 'salda:my-groups:v1';
const MIGRATED_KEY = 'salda:migrated-to-cloud';

interface StoredData {
  version: 1;
  groups: Group[];
}

type MaybeStorage = Storage | undefined;
const defaultStorage = (): MaybeStorage => globalThis.localStorage;

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

function read(storage: MaybeStorage, key: string): unknown {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(storage: MaybeStorage, key: string, value: unknown): void {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Sin espacio o almacenamiento bloqueado: la app sigue funcionando en memoria.
  }
}

/** Grupos guardados en el navegador (modo local). */
export function loadGroups(storage: MaybeStorage = defaultStorage()): Group[] {
  const data = read(storage, GROUPS_KEY) as Partial<StoredData> | null;
  return isGroupArray(data?.groups) ? data.groups : [];
}

export function saveGroups(groups: Group[], storage: MaybeStorage = defaultStorage()): void {
  const data: StoredData = { version: 1, groups };
  write(storage, GROUPS_KEY, data);
}

/**
 * Ids de los grupos que este navegador creó o abrió, del más nuevo al más viejo.
 * La primera vez se inicializa con los grupos locales existentes.
 */
export function loadMyGroupIds(storage: MaybeStorage = defaultStorage()): string[] {
  const ids = read(storage, MY_GROUPS_KEY);
  if (Array.isArray(ids) && ids.every((id) => typeof id === 'string')) return ids;
  return loadGroups(storage).map((g) => g.id);
}

export function saveMyGroupIds(ids: string[], storage: MaybeStorage = defaultStorage()): void {
  write(storage, MY_GROUPS_KEY, ids);
}

/** Grupos locales que todavía no se subieron a la nube (se suben una sola vez). */
export function takeGroupsToMigrate(storage: MaybeStorage = defaultStorage()): Group[] {
  if (read(storage, MIGRATED_KEY)) return [];
  write(storage, MIGRATED_KEY, true);
  return loadGroups(storage);
}
