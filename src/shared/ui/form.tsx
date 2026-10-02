import { CircleAlert, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./button";

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      tabIndex={-1}
      className="flex animate-rise items-start gap-2 rounded-2xl border border-danger/40 bg-card p-4 text-sm text-danger"
    >
      <CircleAlert size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
      {children}
    </p>
  );
}

export function SubmitButton({
  pending,
  icon,
  children,
  className = "",
}: {
  pending: boolean;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`w-full ${className}`}
    >
      {pending ? (
        <LoaderCircle size={18} aria-hidden="true" className="animate-spin" />
      ) : (
        icon
      )}
      {children}
    </Button>
  );
}
