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
}
