"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  CircleHelp,
  CreditCard,
  Globe,
  HandCoins,
  type LucideIcon,
  Receipt,
  Scissors,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import * as z from "zod";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { today } from "./agenda-manager";
import { adminQuery } from "./api";
import { bestDay, breakdown, changeOf, previousRange } from "./money-view";
import { PERIODS, type Period, rangeOf } from "./periods";
import { type AdminText, pill } from "./ui";

const summarySchema = z.object({
  currency: z.string(),
  cuts: z.number(),
  servicesMinor: z.number(),
  productsMinor: z.number(),
  commissionMinor: z.number(),
  collected: z.object({
    onlineMinor: z.number(),
    cashMinor: z.number(),
    cardMinor: z.number(),
    transferMinor: z.number(),
    unrecordedMinor: z.number(),
  }),
  days: z.array(z.object({ date: z.string(), totalMinor: z.number() })),
});
type Summary = z.output<typeof summarySchema>;
type Day = Summary["days"][number];
const summaryQuery = (from: string, to: string) => ({
  ...adminQuery(`earnings/summary?from=${from}&to=${to}`, summarySchema),
  placeholderData: keepPreviousData,
});

/** "↑ 12 %" in the accent, "↓ 8 %" muted; nothing to compare reads as such. */
function Change({ value, label }: { value: number | null; label: string }) {
  if (value === null) return null;
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-sm ${up ? "text-accent-text" : "text-fg-muted"}`}
    >
      <Icon size={16} aria-hidden="true" />
      {Math.abs(value)} %<span className="sr-only"> {label}</span>
    </span>
  );
}

function Bars({
  days,
  money,
  label,
  locale,
  best,
}: {
  days: Day[];
  money: (minor: number) => string;
  label: (date: string) => string;
  locale: Locale;
  best?: Day | undefined;
}) {
  const [active, setActive] = useState(days.length - 1);
  const max = Math.max(1, ...days.map((d) => d.totalMinor));
  const shown = days[active] ?? days[days.length - 1];
  const tick = (date: string) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: "UTC",
      ...(days.length <= 7 ? { weekday: "short" } : { day: "numeric" }),
    }).format(new Date(`${date}T00:00:00Z`));

  return (
    <div className="grid gap-3">
      <p aria-live="polite" className="flex justify-between gap-3 text-sm">
        <span className="capitalize text-fg-muted">
          {shown && label(shown.date)}
        </span>
        <strong className="tabular-nums">
          {shown && money(shown.totalMinor)}
        </strong>
      </p>
      <div className="flex h-44 items-end gap-0.5 border-b border-line">
        {days.map((d, i) => (
          <button
            key={d.date}
            type="button"
            aria-label={`${label(d.date)}: ${money(d.totalMinor)}`}
            aria-pressed={i === active}
            onPointerEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            className="flex h-full min-w-0 flex-1 cursor-pointer items-end focus-visible:outline-2 focus-visible:outline-accent"
          >
            <span
              className={`mx-auto w-full max-w-12 rounded-t-[4px] transition-opacity ${d === best ? "bg-accent" : "bg-accent/70"} ${i === active ? "" : "opacity-60"}`}
              style={{ height: `${(d.totalMinor / max) * 100}%` }}
            />
          </button>
        ))}
      </div>
      <div aria-hidden className="flex gap-0.5 text-xs text-fg-muted">
        {days.map((d, i) => (
          <span key={d.date} className="min-w-0 flex-1 text-center">
            {(days.length <= 7 || i % 7 === 0) && tick(d.date)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** A figure that uses its whole card: label and icon on top, the number, and how it moved. */
function Kpi({
  icon: Icon,
  label,
  value,
  change,
  detail,
  vs,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  change: number | null;
  detail?: string | undefined;
  vs: string;
}) {
  return (
    <div className="grid content-between gap-2 rounded-3xl border border-line bg-card p-4">
      <dt className="flex items-center gap-2 text-sm text-fg-muted">
        <Icon size={16} aria-hidden="true" />
        {label}
      </dt>
      <dd className="flex flex-wrap items-baseline justify-between gap-x-2">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        <Change value={change} label={vs} />
      </dd>
      {detail && <dd className="text-sm text-fg-muted">{detail}</dd>}
    </div>
  );
}

const METHOD_ICON: Record<string, LucideIcon> = {
  cash: Banknote,
  card: CreditCard,
  transfer: ArrowLeftRight,
  online: Globe,
  unrecorded: CircleHelp,
};

export function Revenue({
  locale,
  productsEnabled,
  t,
}: {
  locale: Locale;
  productsEnabled: boolean;
  t: AdminText;
}) {
  const text = t.revenue;
  const [period, setPeriod] = useState<Period>("today");
  const { from, to } = rangeOf(period, today());
  const before = previousRange(from, to);
  const query = useQuery(summaryQuery(from, to));
  const previous = useQuery(summaryQuery(before.from, before.to));
  const data = query.data;
  const past = previous.data;
  const money = (minor: number) =>
    data ? formatMoney(minor, data.currency, locale) : "…";
  const label = (date: string) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: "UTC",
      weekday: "long",
      day: "numeric",
      month: "short",
    }).format(new Date(`${date}T00:00:00Z`));

  const totalOf = (s?: Summary) => (s ? s.servicesMinor + s.productsMinor : 0);
  const total = totalOf(data);
  const net = data ? total - data.commissionMinor : 0;
  const average = data?.cuts ? Math.round(data.servicesMinor / data.cuts) : 0;
  const pastAverage = past?.cuts
    ? Math.round(past.servicesMinor / past.cuts)
    : 0;
  const ways = data
    ? breakdown([
        ["cash", data.collected.cashMinor],
        ["card", data.collected.cardMinor],
        ["transfer", data.collected.transferMinor],
        ["online", data.collected.onlineMinor],
        ["unrecorded", data.collected.unrecordedMinor],
      ])
    : [];
  const wayLabel = (key: string) =>
    key === "online"
      ? text.online
      : key === "unrecorded"
        ? text.unrecorded
        : t.methods[key as keyof AdminText["methods"]];
  const best = data ? bestDay(data.days) : undefined;
  const servicesShare =
    total > 0 && data ? (data.servicesMinor / total) * 100 : 0;

  return (
    <div className="grid gap-5">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">{text.period}</legend>
        {PERIODS.map((p) => (
          <label key={p} className={pill}>
            <input
              type="radio"
              name="period"
              className="sr-only"
              checked={period === p}
              onChange={() => setPeriod(p)}
            />
            {text.periods[p]}
          </label>
        ))}
      </fieldset>
      {query.isError ? (
        <p role="alert" className="text-sm text-danger">
          {text.failed}
        </p>
      ) : (
        <div
          className={`grid gap-5 transition-opacity ${query.isFetching && query.isPlaceholderData ? "opacity-60" : ""}`}
        >
          <section className="grid gap-4 rounded-[1.75rem] border border-accent bg-card p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="grid gap-1">
              <p className="text-sm text-fg-muted">{text.total}</p>
              <p className="flex flex-wrap items-baseline gap-x-3">
                <span className="text-4xl font-semibold tabular-nums">
                  {money(total)}
                </span>
                <Change
                  value={past ? changeOf(total, totalOf(past)) : null}
                  label={text.vsBefore}
                />
              </p>
              <p className="text-sm text-fg-muted">
                {past && totalOf(past) > 0 ? text.vsBefore : text.noBefore}
              </p>
            </div>
            {data && data.commissionMinor > 0 && (
              <div className="grid gap-0.5 md:text-right">
                <p className="text-sm text-fg-muted">{text.net}</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {money(net)}
                </p>
                <p className="text-sm text-fg-muted">
                  {text.commission} −{money(data.commissionMinor)}
                </p>
              </div>
            )}
            {productsEnabled && data && total > 0 && (
              <div className="grid gap-2 md:col-span-2">
                <div
                  className="flex h-2.5 overflow-hidden rounded-full bg-line"
                  role="img"
                  aria-label={`${text.services} ${money(data.servicesMinor)} · ${text.products} ${money(data.productsMinor)}`}
                >
                  <span
                    className="bg-accent"
                    style={{ width: `${servicesShare}%` }}
                  />
                  <span
                    className="bg-accent/40"
                    style={{ width: `${100 - servicesShare}%` }}
                  />
                </div>
                <p className="flex flex-wrap justify-between gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="size-2.5 rounded-full bg-accent"
                    />
                    {text.services} ·{" "}
                    <strong className="tabular-nums">
                      {money(data.servicesMinor)}
                    </strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="size-2.5 rounded-full bg-accent/40"
                    />
                    {text.products} ·{" "}
                    <strong className="tabular-nums">
                      {money(data.productsMinor)}
                    </strong>
                  </span>
                </p>
              </div>
            )}
          </section>

          <dl className="grid gap-3 sm:grid-cols-3">
            <Kpi
              icon={Scissors}
              label={text.cuts}
              value={data ? String(data.cuts) : "…"}
              change={data && past ? changeOf(data.cuts, past.cuts) : null}
              vs={text.vsBefore}
            />
            <Kpi
              icon={Receipt}
              label={text.average}
              value={data?.cuts ? money(average) : "—"}
              change={
                data?.cuts && pastAverage
                  ? changeOf(average, pastAverage)
                  : null
              }
              vs={text.vsBefore}
            />
            <Kpi
              icon={HandCoins}
              label={text.commission}
              value={data ? money(data.commissionMinor) : "…"}
              change={
                data && past
                  ? changeOf(data.commissionMinor, past.commissionMinor)
                  : null
              }
              detail={
                data && total > 0 && data.commissionMinor > 0
                  ? text.ofTotal.replace(
                      "{n}",
                      String(Math.round((data.commissionMinor / total) * 100)),
                    )
                  : undefined
              }
              vs={text.vsBefore}
            />
          </dl>

          {data && total === 0 ? (
            <p className="text-fg-muted">{text.nothing}</p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
              <section className="grid content-start gap-3 rounded-[1.75rem] border border-line bg-card p-5">
                <h2 className="text-lg font-medium">{text.howCollected}</h2>
                <ul className="grid gap-3">
                  {ways.map((w) => {
                    const Icon = METHOD_ICON[w.key] ?? CircleHelp;
                    const warn = w.key === "unrecorded";
                    return (
                      <li key={w.key} className="grid gap-1.5 text-sm">
                        <p className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-2 ${warn ? "text-danger" : ""}`}
                          >
                            <Icon size={16} aria-hidden="true" />
                            {wayLabel(w.key)}
                          </span>
                          <span className="tabular-nums">
                            <strong>{money(w.minor)}</strong>
                            <span className="ml-2 text-fg-muted">
                              {w.share} %
                            </span>
                          </span>
                        </p>
                        <div className="h-1.5 overflow-hidden rounded-full bg-line">
                          <div
                            className={`h-full rounded-full ${warn ? "bg-danger" : "bg-accent"}`}
                            style={{ width: `${w.share}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
              {data && data.days.length > 1 && (
                <section className="grid content-start gap-3 rounded-[1.75rem] border border-line bg-card p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-lg font-medium">{text.byDay}</h2>
                    {best && (
                      <p className="inline-flex items-center gap-1.5 text-sm text-accent-text">
                        <Trophy size={14} aria-hidden="true" />
                        {text.bestDay
                          .replace("{day}", label(best.date))
                          .replace("{amount}", money(best.totalMinor))}
                      </p>
                    )}
                  </div>
                  <Bars
                    key={`${from}:${to}`}
                    days={data.days}
                    money={money}
                    label={label}
                    locale={locale}
                    best={best}
                  />
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
