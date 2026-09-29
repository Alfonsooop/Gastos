import { useState } from 'react';
import type { Cents, ExpenseItem, Member } from '../types';
import type { DistributionResult } from '../lib/distribution';
import { firstItem } from '../lib/expenseItems';
import { Avatar } from './Avatar';
import { MoneyInput } from './MoneyInput';
import { ItemsEditor } from './ItemsEditor';

interface DistributionEditorProps {
  members: Member[];
  distribution: DistributionResult;
  onToggle: (memberId: string) => void;
  onAmountChange: (memberId: string, amount: Cents | null) => void;
  onUnlock: (memberId: string) => void;
  onItemsChange: (memberId: string, items: ExpenseItem[]) => void;
}

/**
 * Lista de integrantes con checkbox de participación y el monto que le
 * corresponde a cada uno. Los montos se pueden editar como en una planilla:
 * el valor escrito queda fijo (🔒) y el resto se reparte solo. Con la flecha
 * se puede detallar, opcionalmente, qué consumió cada persona.
 */
export function DistributionEditor({
  members,
  distribution,
  onToggle,
  onAmountChange,
  onUnlock,
  onItemsChange,
}: DistributionEditorProps) {
  const byMember = new Map(distribution.participants.map((p) => [p.memberId, p]));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (memberId: string) => {
    const participant = byMember.get(memberId);
    const opening = !expanded.has(memberId);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (opening) next.add(memberId);
      else next.delete(memberId);
      return next;
    });
    // Al abrir un detalle vacío, arrancamos con un renglón (con el monto que ya tenía, si era personalizado).
    if (opening && participant && !participant.items?.length) onItemsChange(memberId, [firstItem(participant)]);
    // Al cerrar, si quedó un único renglón sin completar, lo descartamos.
    if (!opening && participant?.items?.length === 1 && !participant.items[0]?.description.trim() && !participant.items[0]?.amount)
      onItemsChange(memberId, []);
  };

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-card ring-1 ring-line">
      {members.map((m) => {
        const participant = byMember.get(m.id);
        const selected = Boolean(participant);
        const custom = participant?.isCustom ?? false;
        const items = participant?.items ?? [];
        const itemized = items.length > 0;
        const isOpen = selected && expanded.has(m.id);
        return (
          <li key={m.id} className={`px-3 py-2.5 transition sm:px-4 ${selected ? '' : 'bg-paper/60'}`}>
            <div className="flex items-center gap-2 sm:gap-3">
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 py-1 sm:gap-3">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggle(m.id)}
                  className="size-5 shrink-0 cursor-pointer accent-ink"
                />
                <span className="hidden sm:inline-flex">
                  <Avatar name={m.name} size="sm" />
                </span>
                <span className="min-w-0">
                  <span className={`block truncate font-semibold ${selected ? '' : 'text-muted'}`}>{m.name}</span>
                  {itemized && !isOpen && (
                    <span className="block text-xs text-muted">
                      {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
                    </span>
                  )}
                </span>
              </label>

              {selected && participant ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(m.id)}
                    aria-expanded={isOpen}
                    aria-label={`${isOpen ? 'Ocultar' : 'Detallar'} lo que consumió ${m.name}`}
                    title="Detallar qué consumió (opcional)"
                    className={`inline-flex size-8 items-center justify-center rounded-full transition hover:bg-ink/5 ${itemized ? 'text-ink' : 'text-muted'}`}
                  >
                    <svg viewBox="0 0 20 20" className={`size-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="currentColor" aria-hidden>
                      <path d="M7 4l7 6-7 6z" />
                    </svg>
                  </button>
                  <MoneyInput
                    aria-label={`Monto de ${m.name}`}
                    value={participant.amount}
                    readOnly={itemized}
                    onChange={(v) => onAmountChange(m.id, v)}
                    onClick={() => itemized && !isOpen && toggleExpanded(m.id)}
                    className={`h-11 w-32 rounded-xl ring-1 transition focus-within:ring-2 focus-within:ring-ink sm:w-36 ${
                      custom ? 'bg-lime-soft font-semibold ring-ink/25' : 'bg-paper ring-line text-ink-soft'
                    }`}
                  />
                  {custom ? (
                    <button
                      type="button"
                      onClick={() => onUnlock(m.id)}
                      title={itemized ? 'Monto detallado por ítems. Tocá para borrar el detalle y volver a automático.' : 'Monto fijado a mano. Tocá para volver a automático.'}
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
            </div>

            {isOpen && participant && (
              <div className="mt-2 mb-1">
                <ItemsEditor memberName={m.name} items={items} onChange={(next) => onItemsChange(m.id, next)} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
