import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg' | 'sm';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-ink-soft disabled:bg-ink/40',
  accent: 'bg-lime text-ink hover:brightness-95 disabled:opacity-50',
  secondary: 'bg-card text-ink ring-1 ring-line hover:ring-ink/30 disabled:opacity-50',
  ghost: 'text-ink-soft hover:bg-ink/5 disabled:opacity-40',
  danger: 'bg-minus text-white hover:brightness-95 disabled:opacity-50',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-xl',
  md: 'h-11 px-4 text-[15px] rounded-2xl',
  lg: 'h-14 px-6 text-base rounded-2xl',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = ''): string {
  return [
    'inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.98] select-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed',
    VARIANTS[variant],
    SIZES[size],
    extra,
  ].join(' ');
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant, size, className = '', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
}

export function LinkButton({ variant, size, className = '', ...props }: LinkButtonProps) {
  return <a className={buttonClass(variant, size, className)} {...props} />;
}
