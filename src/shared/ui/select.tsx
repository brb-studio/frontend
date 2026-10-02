import { ChevronDown } from "lucide-react";
import { type ComponentProps, type ReactNode, useId } from "react";

type SelectProps = ComponentProps<"select"> & {
  label: string;
  icon?: ReactNode;
};

export function Select({
  label,
  icon,
  id,
  className = "",
  children,
  ...select
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;

  return (
    <div className={`grid gap-2 ${className}`}>
      <label htmlFor={selectId} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <select
          {...select}
          id={selectId}
          className={`h-13 w-full appearance-none rounded-2xl border border-line-strong bg-surface pr-12 text-fg transition-colors focus:border-accent-text ${icon ? "pl-12" : "pl-4"}`}
        >
          {children}
        </select>
        {icon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-4 grid place-items-center text-accent-text"
          >
            {icon}
          </span>
        )}
        <ChevronDown
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-fg-muted"
        />
      </div>
    </div>
  );
}
