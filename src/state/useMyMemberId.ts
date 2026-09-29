import { useCallback, useState } from 'react';
import type { Group } from '../types';
import { loadMyMemberId, saveMyMemberId } from '../storage/identityStorage';

/**
 * Quién es la persona que usa este navegador dentro del grupo.
 * - memberId: el integrante elegido (si todavía existe en el grupo)
 * - asked: si ya respondió (eligió alguien o dijo "ahora no")
 */
export function useMyMemberId(group: Group) {
  const [stored, setStored] = useState(() => loadMyMemberId(group.id));
  const memberId = stored && group.members.some((m) => m.id === stored) ? stored : undefined;

  const setMemberId = useCallback(
    (id: string) => {
      saveMyMemberId(group.id, id);
      setStored(id);
    },
    [group.id],
  );

  return { memberId, asked: stored !== undefined && (stored === '' || Boolean(memberId)), setMemberId };
}
