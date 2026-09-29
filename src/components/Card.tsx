import type { ReactNode } from 'react';
import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-3xl bg-card p-4 shadow-[0_1px_0_rgba(22,24,29,0.04)] ring-1 ring-line sm:p-5 ${className}`} {...props} />;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-display text-xl font-bold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}
