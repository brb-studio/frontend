import type { ReactNode } from "react";

/** Presentational pieces of a legal page (privacy notice), shared by the tenant and marketing sites. */

export function LegalHeader({
  title,
  updated,
}: {
  title: string;
  updated: string;
}) {
  return (
    <header className="grid animate-rise gap-2">
      <h1 className="font-medium text-title">{title}</h1>
      <p className="text-sm text-fg-muted">{updated}</p>
    </header>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-medium text-fg">{title}</h2>
      {children}
    </section>
  );
}

export function LegalList({ items }: { items: readonly string[] }) {
  return (
    <ul className="grid list-outside list-disc gap-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
