import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

export function FieldError({ children, id }: { children?: ReactNode; id?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-minus">
      {children}
    </p>
  );
}

export const inputClass = (hasError = false) =>
  `h-12 w-full rounded-2xl bg-card px-4 ring-1 outline-none transition placeholder:text-muted/70 focus:ring-2 ${
    hasError ? 'ring-minus focus:ring-minus' : 'ring-line focus:ring-ink'
  }`;

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  hint?: string;
  error?: string;
  onChange: (value: string) => void;
}

export function TextField({ label, hint, error, onChange, ...props }: TextFieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label} {hint && <span className="font-normal text-muted">· {hint}</span>}
      </label>
      <input
        id={id}
        className={inputClass(Boolean(error))}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}
