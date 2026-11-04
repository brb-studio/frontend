"use client";

import { CircleCheck, type LucideIcon, Pencil, X } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { pill } from "./ui";

/** What was just saved, in words, until it's closed or replaced. */
export function Notice({
  message,
  closeLabel,
  onClose,
}: {
  message: string | null;
  closeLabel: string;
  onClose: () => void;
}) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="flex items-start justify-between gap-3 rounded-2xl border border-accent bg-card px-4 py-3 text-sm"
    >
      <p className="flex items-start gap-2">
        <CircleCheck
          size={18}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-accent-text"
        />
        {message}
      </p>
      <button
        type="button"
        aria-label={closeLabel}
        className="-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-fg-muted hover:text-fg"
        onClick={onClose}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

/** An on/off switch with its label, for "active". */
export function ActiveSwitch({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 pr-1">
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-6 w-11 rounded-full bg-line transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
      />
      <span>{label}</span>
    </label>
  );
}

/** One-choice pills (status, branch, kind…). */
export function ChoicePills<K extends string>({
  name,
  label,
  value,
  options,
  onChange,
}: {
  name: string;
  label: string;
  value: K;
  options: readonly (readonly [K, string])[];
  onChange: (value: K) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map(([key, text]) => (
        <label key={key || "all"} className={pill}>
          <input
            type="radio"
            name={name}
            checked={value === key}
            onChange={() => onChange(key)}
            className="sr-only"
          />
          {text}
        </label>
      ))}
    </div>
  );
}

/** A line of the card: an icon and a text, optionally as a warning. */
export function Fact({
  icon: Icon,
  tone = "muted",
  children,
}: {
  icon: LucideIcon;
  tone?: "muted" | "warn" | "accent";
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 ${tone === "warn" ? "text-danger" : tone === "accent" ? "text-accent-text" : "text-fg-muted"}`}
    >
      <Icon size={14} aria-hidden="true" className="shrink-0" />
      {children}
    </span>
  );
}

export const EditButton = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line px-4 hover:border-accent"
  >
    <Pencil size={14} aria-hidden="true" />
    {label}
  </button>
);

/**
 * The card every list of the panel uses: a picture (photo, or a big icon or text), the title with
 * what matters most on its right, facts underneath and the actions at the bottom.
 */
export function EntityCard({
  photo,
  icon: Icon,
  badge,
  title,
  aside,
  muted = false,
  highlight = false,
  children,
  actions,
}: {
  photo?: string | undefined;
  icon: LucideIcon;
  /** Shown instead of the icon when there is no photo (initials, "15 %"). */
  badge?: string | undefined;
  title: ReactNode;
  aside?: ReactNode;
  muted?: boolean;
  highlight?: boolean;
  children?: ReactNode;
  actions: ReactNode;
}) {
  return (
    <li
      className={`grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 rounded-3xl border bg-card p-3 text-sm ${highlight ? "border-accent" : "border-line"} ${muted ? "opacity-60" : ""}`}
    >
      <div className="relative grid aspect-square place-items-center overflow-hidden rounded-2xl bg-surface text-fg-muted">
        {photo ? (
          <Image
            src={photo}
            alt=""
            fill
            sizes="88px"
            className="object-cover"
          />
        ) : badge ? (
          <span className="px-1 text-center text-xl font-semibold text-accent-text tabular-nums">
            {badge}
          </span>
        ) : (
          <Icon size={26} aria-hidden="true" />
        )}
      </div>
      <div className="grid min-w-0 content-between gap-2">
        <div className="grid gap-1">
          <p className="flex items-start justify-between gap-2">
            <span className="text-base font-medium">{title}</span>
            {aside && <span className="shrink-0">{aside}</span>}
          </p>
          {children}
        </div>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>
    </li>
  );
}

/** A settings block: an icon, its title, one line on what it is for, and its content. */
export function Section({
  icon: Icon,
  title,
  lead,
  aside,
  children,
}: {
  icon: LucideIcon;
  title: string;
  lead?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-5 rounded-[1.75rem] border border-line bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-surface text-accent-text">
            <Icon size={20} aria-hidden="true" />
          </span>
          <div className="grid gap-0.5">
            <h2 className="text-lg font-medium">{title}</h2>
            {lead && <p className="text-sm text-fg-muted">{lead}</p>}
          </div>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
