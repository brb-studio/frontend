"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import type { AdminResult } from "./actions";

export type AdminText = Dictionary["admin"];

/** A titled card holding one admin list or form. */
export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 rounded-[1.75rem] border border-line bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** What the API said about the last save: "Saved." or the failure with each field issue. */
export function Result({
  result,
  t,
}: {
  result?: AdminResult;
  t: AdminText["common"];
}) {
  if (!result) return null;
  if (result.ok) {
    return (
      <p role="status" className="text-sm text-accent-text">
        {t.saved}
      </p>
    );
  }
  return (
    <div
      role="alert"
      className="grid gap-1 rounded-2xl border border-danger/40 p-3 text-sm text-danger"
    >
      <p>
        {t.failed}: {result.message}
      </p>
      {result.issues.length > 0 && (
        <ul className="list-inside list-disc">
          {result.issues.map((issue) => (
            <li key={`${issue.path}:${issue.message}`}>
              {issue.path ? `${issue.path}: ` : ""}
              {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A labeled checkbox styled like the rest of the forms. */
export function Toggle({
  label,
  checked,
  onChange,
  name,
}: {
  label: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  name?: string;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(event) => onChange?.(event.target.checked)}
        className="size-5 accent-[var(--color-accent)]"
      />
      {label}
    </label>
  );
}

/** A row in an admin list: an optional photo, a title line, details, and its actions. */
export function Row({
  title,
  meta,
  image,
  muted = false,
  children,
}: {
  title: ReactNode;
  meta?: ReactNode;
  /** Shows a thumbnail (or an empty frame when "" is passed for an item without a photo). */
  image?: string;
  muted?: boolean;
  children?: ReactNode;
}) {
  return (
    <li
      className={`grid gap-3 rounded-3xl border border-line bg-surface px-4 py-3 text-sm ${muted ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-3">
        {image !== undefined && (
          <span className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-line bg-card">
            {image && (
              <Image
                src={image}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
              />
            )}
          </span>
        )}
        <div className="grid min-w-0 gap-0.5">
          <p className="font-medium">{title}</p>
          {meta && <p className="text-fg-muted">{meta}</p>}
        </div>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </li>
  );
}

/** A URL name from a display name: "Corte clásico" → "corte-clasico". */
export const slugify = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export const smallButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line px-4 text-sm transition-colors hover:border-accent-text disabled:opacity-50";

/** A radio styled as a pill: hide the input with sr-only inside the label; checked fills with the accent. */
export const pill =
  "relative cursor-pointer rounded-full border border-line bg-card px-4 py-2.5 text-sm transition-colors hover:border-accent-text has-checked:border-accent has-checked:bg-accent has-checked:text-accent-fg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-text";

/** A form's string value, trimmed. */
export const value = (form: FormData, key: string) =>
  String(form.get(key) ?? "").trim();
