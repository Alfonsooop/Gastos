import { useMemo, useState, type ReactNode } from 'react';
import type { Group, Settlement } from '../types';
import { SettlementActions } from '../components/SettlementActions';
import { PaymentHistory } from '../components/PaymentHistory';
import { Page } from '../components/Layout';
import { Button, LinkButton } from '../components/Button';
import { SectionTitle } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { BalanceList } from '../components/BalanceList';
import { SettlementList, settlementsToText } from '../components/SettlementList';
import { ExpenseList } from '../components/ExpenseList';
import { MembersPanel } from '../components/MembersPanel';
import { useGroups } from '../state/GroupsContext';
import { GroupGate } from '../components/GroupGate';
import { InviteButton } from '../components/InviteButton';
import { WhoAreYouDialog } from '../components/WhoAreYouDialog';
import { PersonalCard } from '../components/PersonalCard';
import { useMyMemberId } from '../state/useMyMemberId';
import { getPersonalSummary } from '../lib/personalSummary';
import { InstallBanner } from '../components/InstallBanner';
import { detectPlatform } from '../lib/platform';

const isPhone = detectPlatform(navigator.userAgent, navigator.maxTouchPoints).platform !== 'desktop';
import { paths, type GroupTab } from '../state/router';
import { calculateBalances, calculateGroupTotal, calculateSettlements } from '../lib/balances';
import { formatMoney } from '../lib/money';

const TABS: { id: GroupTab; label: string }[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'gastos', label: 'Gastos' },
  { id: 'integrantes', label: 'Integrantes' },
  { id: 'liquidacion', label: 'Liquidación' },
];

export function GroupPage({ groupId, tab }: { groupId: string; tab: GroupTab }) {
  return <GroupGate groupId={groupId}>{(group) => <GroupView group={group} tab={tab} />}</GroupGate>;
}

function GroupView({ group, tab }: { group: Group; tab: GroupTab }) {
  const balances = useMemo(() => calculateBalances(group.members, group.expenses, group.payments), [group]);
  const settlements = useMemo(() => calculateSettlements(balances), [balances]);
  const total = calculateGroupTotal(group.expenses);
  const { mode } = useGroups();
  const shared = mode === 'cloud';
  const identity = useMyMemberId(group);
  const [choosingIdentity, setChoosingIdentity] = useState(false);
  const me = group.members.find((m) => m.id === identity.memberId);
  // En grupos compartidos, preguntamos una vez "¿quién sos?" al entrar.
  const showWhoAreYou = shared && (choosingIdentity || !identity.asked);

  // Sin identidad (modo local o eligió "Ahora no"), cualquiera puede marcar un pago.
  const anonymous = !shared || !me;
  const renderActions = (s: Settlement, dark = false) => (
    <SettlementActions group={group} settlement={s} meId={me?.id} anonymous={anonymous} dark={dark} />
  );

  const chooseIdentity = (memberId: string) => {
    identity.setMemberId(memberId);
    setChoosingIdentity(false);
  };

  return (
    <Page
      back={paths.groups()}
      title={group.name}
      actions={shared && <InviteButton group={group} />}
      footer={
        group.members.length > 0 && (
          <LinkButton href={paths.newExpense(group.id)} size="lg" className="w-full shadow-lg shadow-ink/15">
            + Agregar gasto
          </LinkButton>
        )
      }
    >
      {group.description && <p className="-mt-1 mb-4 text-muted">{group.description}</p>}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="Gasto total" value={formatMoney(total)} highlight className="col-span-2 sm:col-span-1" />
        <Stat label="Gastos" value={String(group.expenses.length)} />
        <Stat label="Integrantes" value={String(group.members.length)} />
      </div>

      <nav className="sticky top-14 z-10 -mx-4 mt-5 bg-paper/90 px-4 py-2 backdrop-blur" aria-label="Secciones del grupo">
        <div className="flex gap-0.5 overflow-x-auto rounded-2xl bg-ink/5 p-1 [scrollbar-width:none]">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={paths.group(group.id, t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`flex-1 shrink-0 rounded-xl px-2.5 py-2 whitespace-nowrap text-center text-[13px] font-semibold transition sm:px-3 sm:text-sm ${
                tab === t.id ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="mt-4 animate-rise" key={tab}>
        {tab === 'resumen' && (
          <div className="space-y-8">
            {isPhone && <InstallBanner compact />}
            {shared && group.expenses.length > 0 && (
              me ? (
                <PersonalCard
                  me={me}
                  members={group.members}
                  summary={getPersonalSummary(me.id, balances, settlements)}
                  onChange={() => setChoosingIdentity(true)}
                  renderActions={(s) => renderActions(s, true)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setChoosingIdentity(true)}
                  className="w-full rounded-3xl border-2 border-dashed border-line px-4 py-4 text-left transition hover:border-ink/30"
                >
                  <p className="font-semibold">¿Quién sos en este grupo?</p>
                  <p className="text-sm text-muted">Elegí tu nombre y te mostramos cuánto tenés que pagar y a quién.</p>
                </button>
              )
            )}
            {shared && group.expenses.length === 0 && (
              <div className="flex items-center gap-3 rounded-3xl bg-lime-soft px-4 py-4 ring-1 ring-lime">
                <span className="text-3xl" aria-hidden>
                  👋
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Sumá a tus amigos</p>
                  <p className="text-sm text-ink-soft">Compartiles el código y todos pueden cargar gastos.</p>
                </div>
                <InviteButton group={group} />
              </div>
            )}
            <section>
              <SectionTitle>Resumen</SectionTitle>
              {group.expenses.length === 0 ? (
                <EmptyState
                  icon="🍻"
                  title="Todavía no hay gastos registrados."
                  text="Agregá el primero y acá vas a ver cuánto pagó y cuánto le corresponde a cada uno."
                />
              ) : (
                <>
                  <BalanceList members={group.members} balances={balances} meId={me?.id} />
                  <p className="mt-2 px-1 text-xs text-muted">
                    Balance = lo que pagó − lo que le corresponde, contando los pagos ya confirmados. Positivo: recibe dinero. Negativo: tiene que pagar.
                  </p>
                </>
              )}
            </section>
            {group.expenses.length > 0 && (
              <SettlementSection
                group={group}
                settlements={settlements}
                // En Resumen, quien eligió quién es ya tiene los botones en su tarjeta personal.
                renderActions={anonymous ? renderActions : undefined}
              />
            )}
          </div>
        )}
        {tab === 'gastos' && (
          <section>
            <SectionTitle>Gastos</SectionTitle>
            <ExpenseList group={group} />
          </section>
        )}
        {tab === 'integrantes' && <MembersPanel group={group} balances={balances} />}
        {tab === 'liquidacion' && (
          <div className="space-y-8">
            <SettlementSection group={group} settlements={settlements} renderActions={renderActions} showShare />
            <PaymentHistory group={group} />
          </div>
        )}
      </div>

      {showWhoAreYou && (
        <WhoAreYouDialog
          group={group}
          onSelect={chooseIdentity}
          onSkip={() => {
            if (!identity.asked) identity.setMemberId('');
            setChoosingIdentity(false);
          }}
        />
      )}
    </Page>
  );
}

function Stat({ label, value, highlight = false, className = '' }: { label: string; value: string; highlight?: boolean; className?: string }) {
  return (
    <div className={`rounded-2xl px-3 py-3 ${highlight ? 'bg-ink text-white' : 'bg-card ring-1 ring-line'} ${className}`}>
      <p className={`text-[11px] font-semibold tracking-wide uppercase ${highlight ? 'text-lime' : 'text-muted'}`}>{label}</p>
      <p className="tabular mt-0.5 truncate font-display text-lg font-bold sm:text-xl">{value}</p>
    </div>
  );
}

function SettlementSection({
  group,
  settlements,
  renderActions,
  showShare = false,
}: {
  group: Group;
  settlements: ReturnType<typeof calculateSettlements>;
  renderActions?: (s: Settlement) => ReactNode;
  showShare?: boolean;
}) {
  // Avisos de pago que ya no coinciden con ninguna transferencia (ej: cambiaron los gastos).
  const orphanPending = (group.payments ?? []).filter(
    (p) => p.status === 'pending' && !settlements.some((s) => s.from === p.from && s.to === p.to),
  );
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(settlementsToText(group.name, group.members, settlements));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section>
      <SectionTitle
        action={
          showShare &&
          settlements.length > 0 && (
            <Button variant="secondary" size="sm" onClick={copy}>
              {copied ? '¡Copiado! ✓' : 'Copiar'}
            </Button>
          )
        }
      >
        Para saldar las cuentas
      </SectionTitle>
      {group.expenses.length === 0 ? (
        <EmptyState icon="🧮" title="Todavía no hay gastos registrados." text="Cuando cargues gastos, acá vas a ver quién le paga a quién." />
      ) : settlements.length === 0 ? (
        <EmptyState icon="🎉" title="¡Todo está saldado! 🎉" text="Nadie le debe nada a nadie." />
      ) : (
        <>
          <SettlementList members={group.members} settlements={settlements} renderActions={renderActions} />
          <p className="mt-3 px-1 text-xs text-muted">
            {settlements.length === 1 ? 'Con esta transferencia' : `Con estas ${settlements.length} transferencias`} todos quedan
            en $0,00.
          </p>
        </>
      )}
      {orphanPending.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="px-1 text-sm font-semibold">Avisos de pago por revisar</p>
          <SettlementList
            members={group.members}
            settlements={orphanPending.map((p) => ({ from: p.from, to: p.to, amount: p.amount }))}
            renderActions={renderActions}
          />
        </div>
      )}
    </section>
  );
}
