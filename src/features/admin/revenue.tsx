"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { useState } from "react";
import * as z from "zod";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney, toMajor } from "@/shared/i18n/money";
import { Select } from "@/shared/ui/select";
import { today } from "./agenda-manager";
import { adminQuery } from "./api";
import { signed, toneOf } from "./cash-model";
import {
  changeOf,
  csvOf,
  groupFor,
  MODES,
  type Mode,
  type Range,
  rangeFor,
  shareOf,
  shift,
} from "./revenue-model";
import { branchSchema, COUNTER_METHODS, LEDGER_TYPES } from "./schemas";
import { type AdminText, Panel, pill } from "./ui";

const flow = {
  inMinor: z.number().int(),
  outMinor: z.number().int(),
  netMinor: z.number().int(),
};
const summarySchema = z.object({
  currency: z.string(),
  ...flow,
  servicesMinor: z.number().int(),
  productsMinor: z.number().int(),
  byMethod: z.partialRecord(z.enum(COUNTER_METHODS), z.object(flow)),
  series: z.array(z.object({ period: z.string(), ...flow })),
  previous: z.object(flow),
});
const movementsSchema = z.object({
  currency: z.string(),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  rows: z.array(
    z.object({
      id: z.string(),
      at: z.string(),
      localDate: z.string(),
      timeZone: z.string(),
      direction: z.enum(["in", "out"]),
      type: z.enum(LEDGER_TYPES),
      amountMinor: z.number().int(),
      concept: z.string(),
      method: z.enum(COUNTER_METHODS).optional(),
      customer: z.string().optional(),
      reference: z.string().optional(),
    }),
  ),
});
type Row = z.output<typeof movementsSchema>["rows"][number];
type Series = z.output<typeof summarySchema>["series"];

const branchesQuery = adminQuery("branches", z.array(branchSchema));
const FILTERS = {
  all: "",
  in: "&direction=in",
  out: "&direction=out",
  refund: "&type=refund",
  adjustment: "&type=adjustment",
} as const;
type Filter = keyof typeof FILTERS;
const PAGE_SIZE = 25;
const TONE_TEXT = {
  in: "text-money-in",
  out: "text-money-out",
  adjust: "text-money-adjust",
} as const;

function Change({ value, label }: { value: number | null; label: string }) {
  if (value === null) return null;
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-0.5 text-sm text-fg-muted">
      <Icon size={16} aria-hidden="true" />
      {Math.abs(value)} %<span className="sr-only"> {label}</span>
    </span>
  );
}

function Chart({
  series,
  money,
  label,
  tick,
  text,
}: {
  series: Series;
  money: (minor: number) => string;
  label: (period: string) => string;
  tick: (period: string) => string;
  text: AdminText["revenue"];
}) {
  const [active, setActive] = useState(() => {
    const last = series.findLastIndex((s) => s.inMinor > 0 || s.outMinor > 0);
    return last >= 0 ? last : series.length - 1;
  });
  const max = Math.max(1, ...series.flatMap((s) => [s.inMinor, s.outMinor]));
  const shown = series[active] ?? series[series.length - 1];
  const every = Math.ceil(series.length / 8);
  return (
    <div className="grid gap-3">
      <p
        aria-live="polite"
        className="flex flex-wrap justify-between gap-x-3 text-sm"
      >
        <span className="text-fg-muted first-letter:uppercase">
          {shown && label(shown.period)}
        </span>
        {shown && (
          <span className="flex gap-3 tabular-nums">
            <span className="text-money-in">
              {signed("in", money(shown.inMinor))}
            </span>
            <span className="text-money-out">
              {signed("out", money(shown.outMinor))}
            </span>
          </span>
        )}
      </p>
      <div className="flex h-44 items-end gap-1 border-b border-line">
        {series.map((s, i) => (
          <button
            key={s.period}
            type="button"
            aria-label={`${label(s.period)}: ${text.in} ${money(s.inMinor)}, ${text.out} ${money(s.outMinor)}`}
            aria-pressed={i === active}
            onPointerEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            className={`flex h-full min-w-0 flex-1 cursor-pointer items-end justify-center gap-px focus-visible:outline-2 focus-visible:outline-accent ${i === active ? "" : "opacity-60"}`}
          >
            <span
              className="w-full max-w-5 rounded-t-[3px] bg-money-in"
              style={{ height: `${(s.inMinor / max) * 100}%` }}
            />
            <span
              className="w-full max-w-5 rounded-t-[3px] bg-money-out"
              style={{ height: `${(s.outMinor / max) * 100}%` }}
            />
          </button>
        ))}
      </div>
      <div aria-hidden className="flex gap-1 text-xs text-fg-muted">
        {series.map((s, i) => (
          <span key={s.period} className="min-w-0 flex-1 truncate text-center">
            {i % every === 0 && tick(s.period)}
          </span>
        ))}
      </div>
    </div>
  );
}

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
  const [mode, setMode] = useState<Mode>("month");
  const [range, setRange] = useState<Range>(() => rangeFor("month", today()));
  const [branchId, setBranchId] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const groupBy = groupFor(range);
  const scope = `from=${range.from}&to=${range.to}${branchId ? `&branchId=${branchId}` : ""}`;
  const branches = useQuery(branchesQuery);
  const summary = useQuery({
    ...adminQuery(`money/summary?${scope}&groupBy=${groupBy}`, summarySchema),
    placeholderData: keepPreviousData,
  });
  const movements = useQuery({
    ...adminQuery(
      `money/movements?${scope}${FILTERS[filter]}&page=${page}&pageSize=${PAGE_SIZE}`,
      movementsSchema,
    ),
    placeholderData: keepPreviousData,
  });
  const data = summary.data;
  const currency = data?.currency ?? movements.data?.currency ?? "MXN";
  const money = (minor: number) => formatMoney(minor, currency, locale);
  const dayFormat = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...options });
  const asDate = (day: string) => new Date(`${day}T12:00:00Z`);
  const full = dayFormat({ day: "numeric", month: "short", year: "numeric" });
  const short = dayFormat({ day: "numeric", month: "short" });
  const rangeLabel =
    range.from === range.to
      ? full.format(asDate(range.from))
      : `${(range.from.slice(0, 4) === range.to.slice(0, 4) ? short : full).format(asDate(range.from))} – ${full.format(asDate(range.to))}`;
  const periodLabel = (period: string) =>
    groupBy === "month"
      ? dayFormat({ month: "long", year: "numeric" }).format(
          asDate(`${period}-01`),
        )
      : groupBy === "week"
        ? `${short.format(asDate(period))} – ${short.format(new Date(asDate(period).getTime() + 6 * 864e5))}`
        : dayFormat({
            weekday: "short",
            day: "numeric",
            month: "short",
          }).format(asDate(period));
  const tick = (period: string) =>
    groupBy === "month"
      ? dayFormat({ month: "short" }).format(asDate(`${period}-01`))
      : groupBy === "week"
        ? dayFormat({ day: "numeric", month: "short" }).format(asDate(period))
        : dayFormat({ day: "numeric" }).format(asDate(period));
  const stamp = (row: Row, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: row.timeZone,
      ...options,
    }).format(new Date(row.at));

  const go = (next: Range) => {
    setRange(next);
    setPage(1);
  };
  const choose = (next: Mode) => {
    setMode(next);
    if (next !== "range") go(rangeFor(next, today()));
  };

  async function exportCsv() {
    setExporting(true);
    try {
      const rows: Row[] = [];
      for (let p = 1; ; p++) {
        const response = await fetch(
          `/api/admin/money/movements?${scope}${FILTERS[filter]}&page=${p}&pageSize=100`,
        );
        if (!response.ok) throw new Error(String(response.status));
        const chunk = movementsSchema.parse(await response.json());
        rows.push(...chunk.rows);
        if (rows.length >= chunk.total || chunk.rows.length === 0) break;
      }
      const c = text.columns;
      const csv = csvOf([
        [
          c.date,
          c.time,
          c.type,
          c.concept,
          c.customer,
          c.method,
          c.reference,
          c.amount,
        ],
        ...rows.map((r) => [
          r.localDate,
          stamp(r, { hour: "2-digit", minute: "2-digit", hour12: false }),
          t.cash.types[r.type],
          r.concept,
          r.customer ?? "",
          r.method ? t.methods[r.method] : "",
          r.reference ?? "",
          `${r.direction === "out" ? "-" : ""}${toMajor(r.amountMinor, currency)}`,
        ]),
      ]);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(
        new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }),
      );
      link.download = `movimientos-${range.from}-${range.to}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } finally {
      setExporting(false);
    }
  }

  const list = movements.data;
  const pages = list ? Math.max(1, Math.ceil(list.total / PAGE_SIZE)) : 1;
  const income = data ? data.servicesMinor + data.productsMinor : 0;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-3">
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">{text.period}</legend>
            {MODES.map((m) => (
              <label key={m} className={pill}>
                <input
                  type="radio"
                  name="mode"
                  className="sr-only"
                  checked={mode === m}
                  onChange={() => choose(m)}
                />
                {text.modes[m]}
              </label>
            ))}
          </fieldset>
          {mode === "range" ? (
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <label className="grid gap-1 text-xs text-fg-muted">
                {text.from}
                <input
                  type="date"
                  value={range.from}
                  max={range.to}
                  onChange={(e) =>
                    e.target.value && go({ ...range, from: e.target.value })
                  }
                  className="h-11 rounded-full border border-line-strong bg-surface px-4 text-sm text-fg"
                />
              </label>
              <label className="grid gap-1 text-xs text-fg-muted">
                {text.to}
                <input
                  type="date"
                  value={range.to}
                  min={range.from}
                  onChange={(e) =>
                    e.target.value && go({ ...range, to: e.target.value })
                  }
                  className="h-11 rounded-full border border-line-strong bg-surface px-4 text-sm text-fg"
                />
              </label>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => go(shift(mode, range, -1))}
                aria-label={text.previous}
                className="grid size-11 place-items-center rounded-full border border-line-strong"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <p className="min-w-40 text-center font-medium">{rangeLabel}</p>
              <button
                type="button"
                onClick={() => go(shift(mode, range, 1))}
                aria-label={text.next}
                className="grid size-11 place-items-center rounded-full border border-line-strong"
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
        {branches.data && branches.data.length > 1 && (
          <Select
            name="branchId"
            label={text.branch}
            value={branchId}
            onChange={(event) => {
              setBranchId(event.target.value);
              setPage(1);
            }}
          >
            <option value="">{text.allBranches}</option>
            {branches.data.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        )}
      </div>
      {summary.isError ? (
        <p role="alert" className="text-sm text-danger">
          {text.failed}
        </p>
      ) : !data ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : (
        <div
          className={`grid gap-5 transition-opacity ${summary.isFetching && summary.isPlaceholderData ? "opacity-60" : ""}`}
        >
          <dl className="grid gap-2 sm:grid-cols-3 sm:gap-3">
            {[
              {
                label: text.in,
                minor: data.inMinor,
                before: data.previous.inMinor,
                tone: "text-money-in",
              },
              {
                label: text.out,
                minor: data.outMinor,
                before: data.previous.outMinor,
                tone: "text-money-out",
              },
              {
                label: text.net,
                minor: data.netMinor,
                before: data.previous.netMinor,
                tone: "",
              },
            ].map(({ label, minor, before, tone }, i) => (
              <div
                key={label}
                className={`flex items-center justify-between gap-3 rounded-3xl border bg-card px-4 py-3 sm:grid sm:justify-normal sm:gap-1 sm:py-4 ${i === 2 ? "border-line-strong" : "border-line"}`}
              >
                <dt className="text-sm text-fg-muted">{label}</dt>
                <dd className="flex flex-wrap items-baseline justify-end gap-x-2 sm:justify-between">
                  <span
                    className={`text-xl font-semibold tabular-nums sm:text-2xl ${minor === 0 ? "text-fg-muted" : tone}`}
                  >
                    {money(minor)}
                  </span>
                  <Change
                    value={changeOf(minor, before)}
                    label={text.vsBefore}
                  />
                </dd>
              </div>
            ))}
          </dl>

          {data.series.length > 1 && (
            <Panel title={text.chart}>
              <Chart
                key={`${range.from}:${range.to}:${groupBy}`}
                series={data.series}
                money={money}
                label={periodLabel}
                tick={tick}
                text={text}
              />
            </Panel>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            {productsEnabled && (
              <Panel title={text.split}>
                <div
                  className="flex h-2.5 overflow-hidden rounded-full bg-line"
                  role="img"
                  aria-label={`${text.services} ${money(data.servicesMinor)} · ${text.products} ${money(data.productsMinor)}`}
                >
                  <span
                    className="bg-money-in"
                    style={{ width: `${shareOf(data.servicesMinor, income)}%` }}
                  />
                  <span
                    className="bg-money-in/40"
                    style={{ width: `${shareOf(data.productsMinor, income)}%` }}
                  />
                </div>
                <p className="flex flex-wrap justify-between gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="size-2.5 rounded-full bg-money-in"
                    />
                    {text.services} ·{" "}
                    <strong className="tabular-nums">
                      {money(data.servicesMinor)}
                    </strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="size-2.5 rounded-full bg-money-in/40"
                    />
                    {text.products} ·{" "}
                    <strong className="tabular-nums">
                      {money(data.productsMinor)}
                    </strong>
                  </span>
                </p>
              </Panel>
            )}
            <Panel title={text.byMethod}>
              <ul className="grid gap-3 text-sm">
                {COUNTER_METHODS.map((method) => {
                  const m = data.byMethod[method];
                  return (
                    <li key={method} className="grid gap-1.5">
                      <p className="flex items-center justify-between gap-2">
                        <span>{t.methods[method]}</span>
                        <span className="flex gap-3 tabular-nums">
                          <span className="text-money-in">
                            {signed("in", money(m?.inMinor ?? 0))}
                          </span>
                          <span className="text-money-out">
                            {signed("out", money(m?.outMinor ?? 0))}
                          </span>
                        </span>
                      </p>
                      <div className="h-1.5 overflow-hidden rounded-full bg-line">
                        <div
                          className="h-full rounded-full bg-money-in"
                          style={{
                            width: `${shareOf(m?.inMinor ?? 0, data.inMinor)}%`,
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </div>
        </div>
      )}
      <Panel
        title={text.movements}
        action={
          <button
            type="button"
            onClick={() => void exportCsv()}
            disabled={exporting || !list?.total}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-medium disabled:opacity-50"
          >
            <Download size={16} aria-hidden="true" />
            {exporting ? text.exporting : text.export}
          </button>
        }
      >
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">{text.movements}</legend>
          {(Object.keys(FILTERS) as Filter[]).map((f) => (
            <label key={f} className={pill}>
              <input
                type="radio"
                name="filter"
                className="sr-only"
                checked={filter === f}
                onChange={() => {
                  setFilter(f);
                  setPage(1);
                }}
              />
              {text.filters[f]}
            </label>
          ))}
        </fieldset>
        {movements.isError ? (
          <p role="alert" className="text-sm text-danger">
            {text.failed}
          </p>
        ) : !list ? (
          <p className="text-fg-muted">{t.common.loading}</p>
        ) : list.rows.length === 0 ? (
          <p className="py-6 text-center text-fg-muted">{text.none}</p>
        ) : (
          <>
            <ul
              className={`grid gap-2 text-sm transition-opacity ${movements.isFetching && movements.isPlaceholderData ? "opacity-60" : ""}`}
            >
              {list.rows.map((r) => (
                <li
                  key={r.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 rounded-2xl border border-line bg-surface px-3 py-2.5 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:px-4"
                >
                  <time
                    dateTime={r.at}
                    className="col-span-2 text-xs text-fg-muted tabular-nums sm:col-span-1 sm:text-sm"
                  >
                    {stamp(r, {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </time>
                  <span className="grid min-w-0 gap-0.5">
                    <span className="truncate font-medium">
                      {r.concept || t.cash.types[r.type]}
                    </span>
                    <span className="truncate text-fg-muted">
                      {[
                        t.cash.types[r.type],
                        r.customer,
                        r.method && t.methods[r.method],
                        r.reference,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span
                    className={`font-semibold tabular-nums ${TONE_TEXT[toneOf(r)]}`}
                  >
                    {signed(r.direction, money(r.amountMinor))}
                  </span>
                </li>
              ))}
            </ul>
            {pages > 1 && (
              <nav className="flex items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="h-10 rounded-full border border-line-strong px-4 disabled:opacity-50"
                >
                  {text.prevPage}
                </button>
                <span className="text-fg-muted">
                  {text.pageOf
                    .replace("{page}", String(page))
                    .replace("{pages}", String(pages))}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pages}
                  className="h-10 rounded-full border border-line-strong px-4 disabled:opacity-50"
                >
                  {text.nextPage}
                </button>
              </nav>
            )}
          </>
        )}
      </Panel>
    </div>
  );
}
