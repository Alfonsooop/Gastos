import type { Cents, Member } from '../types';
import type { DistributionResult } from '../lib/distribution';
import { Avatar } from './Avatar';
import { MoneyInput } from './MoneyInput';

interface DistributionEditorProps {
  members: Member[];
  distribution: DistributionResult;
  onToggle: (memberId: string) => void;
  onAmountChange: (memberId: string, amount: Cents | null) => void;
  onUnlock: (memberId: string) => void;
}

/**
 * Lista de integrantes con checkbox de participación y el monto que le
 * corresponde a cada uno. Los montos se pueden editar como en una planilla:
 * el valor escrito queda fijo (🔒) y el resto se reparte solo.
 */
export function DistributionEditor({ members, distribution, onToggle, onAmountChange, onUnlock }: DistributionEditorProps) {
  const byMember = new Map(distribution.participants.map((p) => [p.memberId, p]));

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-card ring-1 ring-line">
      {members.map((m) => {
        const participant = byMember.get(m.id);
        const selected = Boolean(participant);
        const custom = participant?.isCustom ?? false;
        return (
          <li key={m.id} className={`flex items-center gap-3 px-3 py-2.5 transition sm:px-4 ${selected ? '' : 'bg-paper/60'}`}>
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-1">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggle(m.id)}
                className="size-5 shrink-0 cursor-pointer accent-ink"
              />
              <Avatar name={m.name} size="sm" />
              <span className={`truncate font-semibold ${selected ? '' : 'text-muted'}`}>{m.name}</span>
            </label>

            {selected && participant ? (
              <div className="flex items-center gap-1">
                <MoneyInput
                  aria-label={`Monto de ${m.name}`}
                  value={participant.amount}
                  onChange={(v) => onAmountChange(m.id, v)}
                  className={`h-11 w-32 rounded-xl ring-1 transition focus-within:ring-2 focus-within:ring-ink sm:w-36 ${
                    custom ? 'bg-lime-soft font-semibold ring-ink/25' : 'bg-paper ring-line text-ink-soft'
                  }`}
                />
                {custom ? (
                  <button
                    type="button"
                    onClick={() => onUnlock(m.id)}
                    title="Monto fijado a mano. Tocá para volver a automático."
                    aria-label={`Volver a automático el monto de ${m.name}`}
                    className="inline-flex size-9 items-center justify-center rounded-full text-base hover:bg-ink/5"
                  >
                    🔒
                  </button>
                ) : (
                  <span
                    title="Automático: se reparte solo"
                    className="inline-flex size-9 items-center justify-center text-[10px] font-bold tracking-wide text-muted uppercase"
                  >
                    auto
                  </span>
                )}
              </div>
            ) : (
              <span className="pr-2 text-sm text-muted">No participa</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
