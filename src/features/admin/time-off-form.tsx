"use client";

import {
  Ban,
  CalendarOff,
  Coffee,
  type LucideIcon,
  Store,
  TreePalm,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, type ReactNode, useState } from "react";
import type { Locale } from "@/shared/i18n/locales";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Select } from "@/shared/ui/select";
import { useAdminAction } from "./api";
import type { AdminBarber, AdminBranch } from "./schemas";
import {
  clashesOf,
  describeRange,
  isValidRange,
  presets,
  type Range,
  rangeOf,
} from "./time-off-model";
import { type AdminText, pill, Result } from "./ui";

export const KINDS = ["break", "time_off", "vacation", "block"] as const;
type Kind = (typeof KINDS)[number];
export const KIND_ICON: Record<Kind | "closure", LucideIcon> = {
  break: Coffee,
  time_off: CalendarOff,
  vacation: TreePalm,
  block: Ban,
  closure: Store,
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid min-w-0 gap-3">
      <legend className="mb-3 text-sm font-medium text-accent-text">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

/** "Block time": who, what kind and when (with quick choices), a summary, and clashes explained. */
export function TimeOffForm({
  locale,
  t,
  barbers,
  branches,
  canCloseBranch,
  onCreated,
}: {
  locale: Locale;
  t: AdminText;
  barbers: AdminBarber[];
  branches: AdminBranch[];
  canCloseBranch: boolean;
  /** What was blocked, in words. */
  onCreated: (message: string) => void;
}) {
  const text = t.timeOff;
  const create = useAdminAction();
  const active = barbers.filter((b) => b.active);
  const [who, setWho] = useState(() =>
    active[0] ? `barber:${active[0].id}` : `branch:${branches[0]?.id ?? ""}`,
  );
  const [scope, id = ""] = who.split(":");
  const branchId =
    scope === "branch" ? id : active.find((b) => b.id === id)?.branchId;
  const branch = branches.find((b) => b.id === branchId) ?? branches[0];
  const timeZone = branch?.timeZone ?? "UTC";
  const [kind, setKind] = useState<Kind>("break");
  const [allDay, setAllDay] = useState(false);
  const [range, setRange] = useState<Range>(() => presets(timeZone).hour);
  const [reason, setReason] = useState("");
  const [tried, setTried] = useState(false);
  const closing = scope === "branch";
  const { start, end } = rangeOf(range, allDay);
  const valid = isValidRange(start, end);
  const name =
    scope === "branch"
      ? `${text.wholeBranch} · ${branch?.name ?? ""}`
      : (active.find((b) => b.id === id)?.name ?? "");
  const summary = valid
    ? [
        name,
        text.kinds[closing ? "closure" : kind],
        describeRange(start, end, locale, text.allDayWord),
      ].join(" · ")
    : null;
  const clashes =
    create.data &&
    !create.data.ok &&
    create.data.code === "APPOINTMENTS_IN_THE_WAY"
      ? clashesOf(create.data.issues)
      : [];
  const set = (patch: Partial<Range>) => setRange((r) => ({ ...r, ...patch }));
  const quick = presets(timeZone);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTried(true);
    if (!valid || !summary) return;
    const note = reason.trim();
    create.mutate(
      {
        method: "POST",
        path: "time-off",
        body: {
          ...(closing
            ? { branchId: id, kind: "closure" }
            : { barberId: id, kind }),
          start,
          end,
          ...(note ? { reason: note } : {}),
        },
      },
      {
        onSuccess: (result) =>
          result.ok && onCreated(text.created.replace("{who}", summary)),
      },
    );
  }

  const time = (at: string) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(new Date(`${at.slice(0, 16)}:00Z`));

  return (
    <form onSubmit={submit} className="grid gap-6">
      <Section title={text.who}>
        <Select
          name="who"
          label={text.who}
          value={who}
          onChange={(event) => setWho(event.target.value)}
          required
        >
          <optgroup label={t.nav.barbers}>
            {active.map((b) => (
              <option key={b.id} value={`barber:${b.id}`}>
                {b.name}
              </option>
            ))}
          </optgroup>
          {canCloseBranch && (
            <optgroup label={text.kinds.closure}>
              {branches.map((b) => (
                <option key={b.id} value={`branch:${b.id}`}>
                  {text.wholeBranch} · {b.name}
                </option>
              ))}
            </optgroup>
          )}
        </Select>
      </Section>

      {!closing && (
        <Section title={text.kind}>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {KINDS.map((option) => {
              const Icon = KIND_ICON[option];
              return (
                <label
                  key={option}
                  className={`${pill} inline-flex items-center gap-2`}
                >
                  <input
                    type="radio"
                    name="kind"
                    value={option}
                    checked={kind === option}
                    onChange={() => setKind(option)}
                    className="sr-only"
                  />
                  <Icon size={16} aria-hidden="true" />
                  {text.kinds[option]}
                </label>
              );
            })}
          </div>
        </Section>
      )}

      <Section title={text.when}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-sm text-fg-muted">
            <Zap size={14} aria-hidden="true" />
            {text.quick}
          </span>
          {(
            [
              ["hour", text.presetHour, false],
              ["restOfDay", text.presetRest, false],
              ["tomorrow", text.presetTomorrow, true],
            ] as const
          ).map(([key, label, whole]) => (
            <button
              key={key}
              type="button"
              className="rounded-full border border-line bg-card px-3 py-1.5 text-sm hover:border-accent"
              onClick={() => {
                setRange(quick[key]);
                setAllDay(whole);
                if (whole) set({ endDay: quick[key].startDay });
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(event) => setAllDay(event.target.checked)}
            className="size-5 accent-accent"
          />
          {text.allDay}
        </label>
        <div
          className={`grid gap-3 ${allDay ? "sm:grid-cols-2" : "sm:grid-cols-4"}`}
        >
          <Field
            name="startDay"
            type="date"
            label={text.start}
            value={range.startDay}
            required
            onChange={(event) => {
              const day = event.target.value;
              set({
                startDay: day,
                ...(range.endDay < day ? { endDay: day } : {}),
              });
            }}
          />
          {!allDay && (
            <Field
              name="startTime"
              type="time"
              label={text.time}
              value={range.startTime}
              required
              onChange={(event) => set({ startTime: event.target.value })}
            />
          )}
          <Field
            name="endDay"
            type="date"
            label={text.end}
            value={range.endDay}
            min={range.startDay}
            required
            onChange={(event) => set({ endDay: event.target.value })}
          />
          {!allDay && (
            <Field
              name="endTime"
              type="time"
              label={text.time}
              value={range.endTime}
              required
              onChange={(event) => set({ endTime: event.target.value })}
            />
          )}
        </div>
        {tried && !valid && (
          <p role="alert" className="text-sm text-danger">
            {text.endBeforeStart}
          </p>
        )}
      </Section>

      <Field
        name="reason"
        label={text.reason}
        value={reason}
        maxLength={200}
        onChange={(event) => setReason(event.target.value)}
      />

      <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4 text-sm">
        {summary && (
          <div className="grid gap-1">
            <p className="text-fg-muted">{text.summary}</p>
            <p className="font-medium">{summary}</p>
          </div>
        )}
        {clashes.length > 0 ? (
          <div
            role="alert"
            className="grid gap-2 rounded-2xl border border-danger/40 p-3 text-danger"
          >
            <p>
              {(clashes.length === 1 ? text.clashOne : text.clash)
                .replace("{n}", String(clashes.length))
                .replace("{times}", clashes.map(time).join(", "))}
            </p>
            <Link
              href={`/${locale}/admin/agenda?date=${clashes[0]?.slice(0, 10) ?? ""}${branch ? `&branch=${branch.id}` : ""}`}
              className="w-fit font-medium underline underline-offset-4"
            >
              {text.goAgenda}
            </Link>
          </div>
        ) : (
          create.data &&
          !create.data.ok && <Result result={create.data} t={t.common} />
        )}
        <Button type="submit" disabled={create.isPending}>
          {t.timeOff.newEntry}
        </Button>
      </div>
    </form>
  );
}
