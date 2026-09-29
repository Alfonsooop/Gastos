import type { ReactNode } from 'react';
import type { Group } from '../types';
import { useGroup } from '../state/GroupsContext';
import { NotFoundPage } from '../pages/NotFoundPage';
import { Page } from './Layout';
import { paths } from '../state/router';

/** Carga un grupo por id y muestra "cargando" o "no encontrado" según corresponda. */
export function GroupGate({ groupId, children }: { groupId: string; children: (group: Group) => ReactNode }) {
  const { group, status } = useGroup(groupId);
  if (status === 'missing') return <NotFoundPage message="No encontramos este grupo." />;
  if (!group) return <LoadingPage />;
  return <>{children(group)}</>;
}

export function LoadingPage() {
  return (
    <Page back={paths.groups()}>
      <div className="flex flex-col items-center py-20 text-muted">
        <span className="size-8 animate-spin rounded-full border-4 border-line border-t-ink" aria-hidden />
        <p className="mt-4 text-sm">Cargando…</p>
      </div>
    </Page>
  );
}
