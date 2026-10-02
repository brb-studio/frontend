import { type ComponentProps, type ReactNode, useId } from "react";

export type FieldProps = ComponentProps<"input"> & {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export function Field({
  label,
  hint,
  error,
  icon,
  action,
  id,
  className = "",
  ...input
}: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy =
    [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`grid gap-2 ${className}`}>
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <div className="group relative">
        <input
          {...input}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-13 w-full rounded-2xl border border-line-strong bg-surface text-fg transition-[border-color,box-shadow] duration-200 placeholder:text-fg-muted focus:border-accent-text aria-invalid:border-danger disabled:opacity-50 ${icon ? "pl-12" : "pl-4"} ${action ? "pr-12" : "pr-4"}`}
        />
        {icon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-4 grid place-items-center text-fg-muted transition-colors group-focus-within:text-accent-text"
          >
            {icon}
          </span>
        )}
        {action && (
          <span className="absolute inset-y-0 right-1.5 grid place-items-center">
            {action}
          </span>
        )}
      </div>
      {hint && (
        <p id={hintId} className="text-sm text-fg-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="animate-rise text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
