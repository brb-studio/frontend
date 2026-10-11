"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { LoaderCircle, X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import { PlatformError } from "./model";

export type PlatformText = Dictionary["platform"];

export const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

export const card = "rounded-3xl border border-line bg-card";

export const field =
  "h-11 w-full rounded-2xl border border-line-strong bg-surface px-3 text-sm text-fg transition-colors focus:border-accent";

export const outlineButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line px-4 text-sm transition-colors hover:border-accent disabled:pointer-events-none disabled:opacity-50";

export const solidButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-fg transition-[box-shadow,filter] hover:shadow-glow disabled:pointer-events-none disabled:opacity-50";

export function Async<T>({
  query,
  t,
  isEmpty,
  children,
}: {
  query: UseQueryResult<T>;
  t: PlatformText["states"];
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`${card} grid gap-3 p-5`}
      >
        <span className="sr-only">{t.loading}</span>
        {[0, 1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-8 animate-pulse rounded-xl bg-line"
            style={{ width: `${100 - n * 12}%` }}
          />
        ))}
      </div>
    );
  }
  if (query.isError) {
    const expired =
      query.error instanceof PlatformError && query.error.status === 401;
    return (
      <div
        role="alert"
        className={`${card} grid justify-items-start gap-3 border-danger/40 p-5 text-sm`}
      >
        <p className="text-danger">{expired ? t.sessionExpired : t.error}</p>
        <button
          type="button"
          className={outlineButton}
          onClick={() => void query.refetch()}
        >
          {t.retry}
        </button>
      </div>
    );
  }
  if (isEmpty?.(query.data)) {
    return <p className={`${card} p-6 text-sm text-fg-muted`}>{t.empty}</p>;
  }
  return (
    <div
      aria-busy={query.isPlaceholderData}
      className={`relative transition-opacity ${query.isPlaceholderData ? "opacity-60" : ""}`}
    >
      {query.isFetching && (
        <LoaderCircle
          size={16}
          aria-hidden="true"
          className="absolute right-3 top-3 animate-spin text-fg-muted"
        />
      )}
      {children(query.data)}
    </div>
  );
}

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: "right";

  primary?: boolean;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  label,
}: {
  columns: Column<T>[];
  rows: T[];
  label: string;
}) {
  const primary = columns.find((c) => c.primary) ?? columns[0];
  const rest = columns.filter((c) => c !== primary);
  return (
    <>
      <div className={`${card} hidden overflow-x-auto md:block`}>
        <table className="w-full min-w-max border-collapse text-left text-sm">
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr className="border-b border-line text-fg-muted">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={`whitespace-nowrap px-4 py-3 font-medium ${c.align === "right" ? "text-right" : ""}`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-0">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-3 align-middle tabular-nums ${c.align === "right" ? "text-right" : ""}`}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul aria-label={label} className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className={`${card} grid gap-3 p-4 text-sm`}>
            <div className="font-medium">{primary?.cell(row)}</div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              {rest.map((c) => (
                <div key={c.key} className="grid gap-0.5">
                  <dt className="text-xs text-fg-muted">{c.header}</dt>
                  <dd className="tabular-nums">{c.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

export function Pager({
  page,
  total,
  limit,
  onPage,
  t,
}: {
  page: number;
  total: number;
  limit: number;
  onPage: (page: number) => void;
  t: PlatformText["states"];
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <nav
      aria-label={fill(t.results, { n: total })}
      className="flex flex-wrap items-center justify-between gap-3 text-sm text-fg-muted"
    >
      <span>{fill(t.results, { n: total })}</span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          className={outlineButton}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          {t.prev}
        </button>
        <span aria-live="polite">{fill(t.page, { page, pages })}</span>
        <button
          type="button"
          className={outlineButton}
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          {t.next}
        </button>
      </span>
    </nav>
  );
}

export function Modal({
  title,
  closeLabel,
  onClose,
  children,
}: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape already closes a modal dialog
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-auto max-h-[92dvh] w-[min(42rem,calc(100vw-1.5rem))] overflow-y-auto rounded-[1.75rem] border border-line bg-canvas p-0 text-fg shadow-soft backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="grid gap-5 p-5 md:p-7">
        <header className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-medium">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line transition-colors hover:border-accent"
          >
            <X size={18} aria-hidden="true" />
            <span className="sr-only">{closeLabel}</span>
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}

export function StatusBadge({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "muted" | "bad";
  children: ReactNode;
}) {
  const tones = {
    ok: "border-accent/40 text-accent-text",
    warn: "border-line-strong text-fg",
    muted: "border-line text-fg-muted",
    bad: "border-danger/40 text-danger",
  };
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
