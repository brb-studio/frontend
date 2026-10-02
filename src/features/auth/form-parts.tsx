import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthSheet({
  backHref,
  backLabel,
  title,
  lead,
  children,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <div className="grid animate-sheet gap-6 rounded-t-[2rem] border border-b-0 border-line bg-sheet px-6 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))] backdrop-blur-2xl md:rounded-none md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
      <header className="grid justify-items-start gap-2">
        <Link
          href={backHref}
          className="mb-2 grid size-11 place-items-center rounded-full border border-line bg-surface transition-colors hover:border-accent-text"
        >
          <ChevronLeft size={20} aria-hidden="true" />
          <span className="sr-only">{backLabel}</span>
        </Link>
        <h1 className="animate-rise text-title font-medium [animation-delay:120ms]">
          {title}
        </h1>
        <p className="animate-rise text-fg-muted [animation-delay:160ms]">
          {lead}
        </p>
      </header>
      {children}
    </div>
  );
}
