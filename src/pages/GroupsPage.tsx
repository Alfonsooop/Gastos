import { useState } from 'react';
import type { Group } from '../types';
import { Page } from '../components/Layout';
import { LinkButton } from '../components/Button';
import { GroupCard } from '../components/GroupCard';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useGroups } from '../state/GroupsContext';
import { paths } from '../state/router';

export function GroupsPage() {
  const { myGroups: groups, myGroupsLoading, deleteGroup, forgetGroup, mode } = useGroups();
  const [toDelete, setToDelete] = useState<Group | null>(null);

  return (
    <Page
      back={paths.home()}
      title="Mis grupos"
      footer={
        groups.length > 0 && (
          <LinkButton href={paths.newGroup()} size="lg" className="w-full">
            + Crear grupo
          </LinkButton>
        )
      }
    >
      {groups.length === 0 && myGroupsLoading ? (
        <p className="py-10 text-center text-sm text-muted">Cargando tus grupos…</p>
      ) : groups.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="No tenés grupos todavía."
          text="Creá tu primer grupo para empezar a dividir gastos."
          action={
            <div className="flex flex-col items-center gap-2">
              <LinkButton href={paths.newGroup()} variant="accent">
                + Crear mi primer grupo
              </LinkButton>
              {mode === 'cloud' && (
                <LinkButton href={paths.join()} variant="secondary">
                  ¿Te invitaron? Unite con un código
                </LinkButton>
              )}
            </div>
          }
        />
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              action={
                <button
                  type="button"
                  onClick={() => setToDelete(g)}
                  aria-label={`Eliminar ${g.name}`}
                  className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-minus-soft hover:text-minus"
                >
                  🗑
                </button>
              }
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="¿Eliminar este grupo?"
        confirmLabel={mode === 'cloud' ? 'Eliminar para todos' : 'Eliminar grupo'}
        secondaryAction={
          mode === 'cloud'
            ? {
                label: 'Sólo quitarlo de mi lista',
                onClick: () => {
                  if (toDelete) forgetGroup(toDelete.id);
                  setToDelete(null);
                },
              }
            : undefined
        }
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) deleteGroup(toDelete.id);
          setToDelete(null);
        }}
      >
        {mode === 'cloud' ? (
          <>
            Si lo eliminás para todos, se borran <strong>{toDelete?.name}</strong> y todos sus gastos para cada persona que tenga
            el link. No se puede deshacer. También podés sólo quitarlo de tu lista.
          </>
        ) : (
          <>
            Se van a borrar <strong>{toDelete?.name}</strong>, sus integrantes y todos sus gastos. No se puede deshacer.
          </>
        )}
      </ConfirmDialog>
    </Page>
  );
}
