import type { Group } from '../types';

export type StoreMode = 'local' | 'cloud';

/**
 * Dónde viven los grupos. Hay dos implementaciones con la misma interfaz:
 * - local: localStorage (sin conexión, sólo este navegador)
 * - cloud: Firestore (compartido por link y sincronizado en vivo)
 */
export interface GroupStore {
  readonly mode: StoreMode;
  /** Escucha un grupo. `null` significa que no existe. Devuelve la función para dejar de escuchar. */
  watch(id: string, onChange: (group: Group | null) => void, onError?: (error: unknown) => void): () => void;
  create(group: Group): Promise<void>;
  /** Aplica una transformación pura sobre la versión más reciente del grupo. */
  update(id: string, transform: (group: Group) => Group): Promise<void>;
  remove(id: string): Promise<void>;
  /** Devuelve el código del grupo, creándolo si todavía no tiene. */
  ensureCode(groupId: string): Promise<string>;
  /** Busca a qué grupo corresponde un código. null si no existe. */
  findGroupIdByCode(code: string): Promise<string | null>;
}
