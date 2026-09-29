import { useMemo, useState } from 'react';
import type { Group } from '../types';
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
import { ShareButton } from '../components/ShareButton';
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
  const balances = useMemo(() => calculateBalances(group.members, group.expenses), [group]);
  const settlements = useMemo(() => calculateSettlements(balances), [balances]);
  const total = calculateGroupTotal(group.expenses);
  const { mode } = useGroups();

  return (
    <Page
      back={paths.groups()}
      title={group.name}
      actions={mode === 'cloud' && <ShareButton group={group} />}
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
                  <BalanceList members={group.members} balances={balances} />
                  <p className="mt-2 px-1 text-xs text-muted">
                    Balance = lo que pagó − lo que le corresponde. Positivo: recibe dinero. Negativo: tiene que pagar.
                  </p>
                </>
              )}
            </section>
            {group.expenses.length > 0 && (
              <SettlementSection group={group} settlements={settlements} />
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
        {tab === 'liquidacion' && <SettlementSection group={group} settlements={settlements} showShare />}
      </div>
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
  showShare = false,
}: {
  group: Group;
  settlements: ReturnType<typeof calculateSettlements>;
  showShare?: boolean;
}) {
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
          <SettlementList members={group.members} settlements={settlements} />
          <p className="mt-3 px-1 text-xs text-muted">
            {settlements.length === 1 ? 'Con esta transferencia' : `Con estas ${settlements.length} transferencias`} todos quedan
            en $0,00.
          </p>
        </>
      )}
    </section>
  );
}
