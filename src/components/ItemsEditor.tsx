import type { ExpenseItem } from '../types';
import { createId } from '../lib/id';
import { formatMoney } from '../lib/money';
import { sumItems } from '../lib/expenseItems';
import { MoneyInput } from './MoneyInput';

interface ItemsEditorProps {
  memberName: string;
  items: ExpenseItem[];
  onChange: (items: ExpenseItem[]) => void;
}

/** Detalle de lo que consumió una persona: renglones "qué" + "cuánto". */
export function ItemsEditor({ memberName, items, onChange }: ItemsEditorProps) {
  const update = (id: string, patch: Partial<ExpenseItem>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  return (
    <div className="rounded-2xl bg-paper px-3 py-3">
      {items.length === 0 ? (
        <p className="px-1 pb-2 text-sm text-muted">
          Opcional: anotá qué consumió {memberName} y su parte va a ser la suma.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={item.id} className="flex items-center gap-2">
              <input
                aria-label={`Ítem ${i + 1} de ${memberName}`}
                placeholder="Qué consumió (ej: Hamburguesa)"
                value={item.description}
                onChange={(e) => update(item.id, { description: e.target.value })}
                className="h-10 min-w-0 flex-1 rounded-xl bg-card px-3 text-[15px] ring-1 ring-line outline-none focus:ring-2 focus:ring-ink"
              />
              <MoneyInput
                aria-label={`Monto del ítem ${i + 1} de ${memberName}`}
                value={item.amount}
                onChange={(amount) => update(item.id, { amount: amount ?? 0 })}
                className="h-10 w-28 shrink-0 rounded-xl bg-card ring-1 ring-line focus-within:ring-2 focus-within:ring-ink"
              />
              <button
                type="button"
                onClick={() => onChange(items.filter((x) => x.id !== item.id))}
                aria-label={`Quitar ítem ${i + 1} de ${memberName}`}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-lg text-muted hover:bg-ink/5"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <button
          type="button"
          onClick={() => onChange([...items, { id: createId(), description: '', amount: 0 }])}
          className="rounded-xl px-2 py-1.5 text-sm font-semibold whitespace-nowrap text-ink-soft hover:bg-ink/5"
        >
          + Agregar ítem
        </button>
        {items.length > 0 && (
          <span className="pr-1 text-sm text-muted">
            Total de {memberName}: <strong className="tabular text-ink">{formatMoney(sumItems(items))}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
