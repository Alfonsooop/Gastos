import type { DistributionResult } from '../lib/distribution';
import { formatMoney } from '../lib/money';

/** Indicador "Asignado: $X / $Y" con el aviso correspondiente. */
export function AllocationStatus({ total, distribution }: { total: number; distribution: DistributionResult }) {
  const { totalAssigned, issue } = distribution;
  const ok = total > 0 && totalAssigned === total && !issue;

  let message: string | null = null;
  if (issue?.type === 'custom-exceeds-total')
    message = `Los montos personalizados superan el total en ${formatMoney(issue.excess)}. Corregí alguno de los valores fijados.`;
  else if (issue?.type === 'unassigned') message = `Faltan asignar ${formatMoney(issue.missing)}.`;
  else if (totalAssigned > total) message = `Los montos asignados superan el total en ${formatMoney(totalAssigned - total)}.`;

  return (
    <div
      aria-live="polite"
      className={`rounded-2xl px-4 py-3 text-sm ${ok ? 'bg-plus-soft text-plus' : message ? 'bg-warn-soft text-warn' : 'bg-ink/5 text-muted'}`}
    >
      <div className="flex items-center justify-between gap-3 font-semibold">
        <span>Asignado</span>
        <span className="tabular">
          {formatMoney(totalAssigned)} / {formatMoney(total)} {ok && '✓'}
        </span>
      </div>
      {message && <p className="mt-1 font-medium">⚠ {message}</p>}
    </div>
  );
}
