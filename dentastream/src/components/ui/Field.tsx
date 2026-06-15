import type { ReactNode } from 'react';

const baseControl =
  'w-full rounded-lg border border-stroke bg-gray-1 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary';

/** Shared control classes so inputs/selects/textareas match across forms. */
export const controlClass = baseControl;

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  /** The control (input/select/textarea). Wrapped by <label> for a11y. */
  children: ReactNode;
}

/**
 * Label + control wrapper. The <label> wraps the control so it is implicitly
 * associated (satisfies a11y "form elements must have labels" without needing
 * per-field id/htmlFor wiring). Keeps every form field consistent (DRY).
 */
export function Field({ label, required, error, className, children }: FieldProps) {
  return (
    <label className={['block', className].filter(Boolean).join(' ')}>
      <span className="mb-1.5 block text-xs font-medium text-dark-5">
        {label}{required && ' *'}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}
