const KEY = 'salda:me:v1';

/** Por grupo: id del integrante que usa este navegador, o '' si eligió no decirlo. */
type Identities = Record<string, string>;

function load(storage: Storage | undefined): Identities {
  try {
    const data = JSON.parse(storage?.getItem(KEY) ?? '{}');
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

export function loadMyMemberId(groupId: string, storage: Storage | undefined = globalThis.localStorage): string | undefined {
  return load(storage)[groupId];
}

export function saveMyMemberId(groupId: string, memberId: string, storage: Storage | undefined = globalThis.localStorage): void {
  try {
    storage?.setItem(KEY, JSON.stringify({ ...load(storage), [groupId]: memberId }));
  } catch {
    // Almacenamiento bloqueado: sólo se pierde el "quién sos".
  }
}
