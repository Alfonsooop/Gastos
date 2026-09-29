import { LinkButton, Button } from '../components/Button';
import { Logo } from '../components/Layout';
import { GroupCard } from '../components/GroupCard';
import { useGroups } from '../state/GroupsContext';
import { navigate, paths } from '../state/router';
import { createSampleGroup } from '../lib/sampleData';
import { isRunningAsInstalledApp } from '../lib/platform';
import { InstallBanner } from '../components/InstallBanner';
import { InstallGuide } from '../components/InstallGuide';
import { useState } from 'react';

export function HomePage() {
  const { myGroups: groups, myGroupsLoading, createGroup, mode } = useGroups();
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const loadSample = async () => {
    const group = createSampleGroup();
    if (await createGroup(group)) navigate(paths.group(group.id));
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pt-14 pb-12 sm:pt-20">
      <section className="animate-rise">
        <Logo size="xl" />
        <p className="mt-5 max-w-md font-display text-3xl leading-tight font-bold tracking-tight text-ink sm:text-4xl">
          Organizá los gastos de tu grupo y{' '}
          <span className="rounded-lg bg-lime px-1.5 box-decoration-clone">olvidate de hacer cuentas.</span>
        </p>
        <p className="mt-4 max-w-md text-muted">
          Anotá quién pagó qué, ajustá sólo los casos especiales y Salda te dice exactamente quién le debe cuánto a quién.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:max-w-md">
          <LinkButton href={paths.newGroup()} size="lg">
            + Crear grupo
          </LinkButton>
          <LinkButton href={paths.groups()} size="lg" variant="secondary">
            Mis grupos
          </LinkButton>
          {mode === 'cloud' && (
            <LinkButton href={paths.join()} size="lg" variant="accent" className="col-span-2">
              🤝 Unirme con un código
            </LinkButton>
          )}
        </div>
      </section>

      <div className="mt-8">
        <InstallBanner />
      </div>

      <section className="mt-12">
        {groups.length === 0 && myGroupsLoading ? (
          <p className="text-center text-sm text-muted">Cargando tus grupos…</p>
        ) : groups.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-line px-6 py-10 text-center">
            <span className="text-4xl" aria-hidden>
              🧾
            </span>
            <p className="mt-3 font-display text-lg font-bold">No tenés grupos todavía.</p>
            <p className="mt-1 text-sm text-muted">Creá tu primer grupo para empezar a dividir gastos.</p>
            <div className="mt-5 flex flex-col items-center gap-2">
              <LinkButton href={paths.newGroup()} variant="accent">
                + Crear mi primer grupo
              </LinkButton>
              {mode === 'cloud' && (
                <LinkButton href={paths.join()} variant="secondary">
                  ¿Te invitaron? Unite con un código
                </LinkButton>
              )}
              <Button variant="ghost" size="sm" onClick={loadSample}>
                o probá con un grupo de ejemplo
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Recientes</h2>
              {groups.length > 3 && (
                <a href={paths.groups()} className="text-sm font-semibold text-muted hover:text-ink">
                  Ver todos →
                </a>
              )}
            </div>
            <div className="space-y-3">
              {groups.slice(0, 3).map((g) => (
                <GroupCard key={g.id} group={g} />
              ))}
            </div>
          </>
        )}
      </section>

      {!isRunningAsInstalledApp() && (
        <button
          type="button"
          onClick={() => setShowInstallGuide(true)}
          className="mx-auto mt-auto pt-12 text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          📲 Cómo agregar Salda a tu celular
        </button>
      )}
      {showInstallGuide && <InstallGuide onClose={() => setShowInstallGuide(false)} />}
    </div>
  );
}
