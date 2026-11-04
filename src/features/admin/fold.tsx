import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

/** A collapsed list with its count ("{n}" in the title); nothing at all when empty. */
export function Fold({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  if (count === 0) return null;
  return (
    <details className="group">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm text-fg-muted [&::-webkit-details-marker]:hidden">
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="transition-transform group-open:rotate-180"
        />
        {title.replace("{n}", String(count))}
      </summary>
      <ul className="mt-2 grid gap-2">{children}</ul>
    </details>
  );
}
