"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useSyncExternalStore } from "react";
import type { Locale } from "@/shared/i18n/locales";
import { CutDetail } from "./cut-detail";
import { CutsTable } from "./cuts";
import { Earnings } from "./earnings";
import { FilterBar, useOptions } from "./filter-bar";
import { formatBps, formatDay, money } from "./format";
import {
  apiQuery,
  breakdownSchema,
  type Entity,
  levelOf,
  platformQuery,
  summarySchema,
} from "./model";
import {
  Async,
  type Column,
  card,
  DataTable,
  fill,
  Pager,
  type PlatformText,
} from "./ui";
import { useDashboardState, type View } from "./use-filters";

const LIMIT = 25;
const noop = () => () => {};

function Kpis({
  filters,
  locale,
  t,
}: {
  filters: ReturnType<typeof useDashboardState>["filters"];
  locale: Locale;
  t: PlatformText;
}) {
  const query = useQuery(
    platformQuery(`summary?${apiQuery(filters)}`, summarySchema),
  );
  const k = t.kpi;
  return (
    <Async query={query} t={t.states}>
      {(groups) => {
        if (groups.length === 0)
          return (
            <p className={`${card} p-6 text-sm text-fg-muted`}>{k.none}</p>
          );
        const missing = groups.reduce((sum, g) => sum + g.unconfigured, 0);
        return (
          <div className="grid gap-4">
            {groups.map((g) => {
              const m = (minor: number) => money(minor, g.currency, locale);
              const cards = [
                {
                  label: k.collected,
                  hint: k.collectedHint,
                  value: m(g.collected),
                },
                { label: k.sales, hint: k.salesHint, value: m(g.sales) },
                { label: k.completed, value: String(g.completed) },
                { label: k.avgTicket, value: m(g.avgTicket) },
                {
                  label: k.commission,
                  hint: k.commissionHint,
                  value: m(g.commission),
                },
                { label: k.paidOut, value: m(g.paidOut) },
                { label: k.pending, value: m(g.pending), accent: true },
              ];
              return (
                <section
                  key={g.currency}
                  aria-label={g.currency}
                  className="grid gap-2"
                >
                  {groups.length > 1 && (
                    <h3 className="text-sm font-medium text-fg-muted">
                      {g.currency}
                    </h3>
                  )}
                  <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {cards.map((c) => (
                      <div
                        key={c.label}
                        className={`${card} grid content-start gap-1 p-4`}
                      >
                        <dt className="text-sm text-fg-muted">{c.label}</dt>
                        <dd
                          className={`text-xl font-medium tabular-nums md:text-2xl ${c.accent ? "text-accent-text" : ""}`}
                        >
                          {c.value}
                        </dd>
                        {c.hint && (
                          <dd className="text-xs text-fg-muted">{c.hint}</dd>
                        )}
                      </div>
                    ))}
                  </dl>
                </section>
              );
            })}
            {groups.length > 1 && (
              <p className="text-xs text-fg-muted">{k.currencyNote}</p>
            )}
            {missing > 0 && (
              <p
                role="status"
                className="rounded-2xl border border-line-strong p-3 text-sm"
              >
                {fill(k.unconfigured, { n: missing })}
              </p>
            )}
          </div>
        );
      }}
    </Async>
  );
}

/** Overview → barbershop → branch → barber: each level is a table whose rows open the next one. */
function Drill({
  state,
  locale,
  t,
}: {
  state: ReturnType<typeof useDashboardState>;
  locale: Locale;
  t: PlatformText;
}) {
  const { filters, page, set } = state;
  const level = levelOf(filters);
  const by =
    level === "overview" ? "tenant" : level === "tenant" ? "branch" : "barber";
  const query = useQuery({
    ...platformQuery(
      `breakdown?${apiQuery(filters, { by, page, limit: LIMIT })}`,
      breakdownSchema,
    ),
    enabled: level !== "barber",
  });
  const c = t.cols;
  const m = (r: Entity, minor: number) => money(minor, r.currency, locale);

  if (level === "barber")
    return <CutsTable state={state} locale={locale} t={t} />;

  const first: Column<Entity> = {
    key: "name",
    header: c.name,
    primary: true,
    cell: (row) => (
      <button
        type="button"
        className="text-left font-medium underline-offset-4 hover:text-accent-text hover:underline"
        onClick={() =>
          set(
            level === "overview"
              ? { tenant: row.id }
              : level === "tenant"
                ? { branch: row.id }
                : { barber: row.id },
          )
        }
      >
        {row.name}
        {row.active === false && (
          <span className="ml-2 text-xs text-fg-muted">({c.inactive})</span>
        )}
      </button>
    ),
  };
  const numbers: Column<Entity>[] = [
    { key: "cuts", header: c.cuts, align: "right", cell: (r) => r.completed },
    {
      key: "sales",
      header: c.sales,
      align: "right",
      cell: (r) => m(r, r.sales),
    },
    {
      key: "avg",
      header: c.avgTicket,
      align: "right",
      cell: (r) => m(r, r.avgTicket),
    },
    {
      key: "collected",
      header: c.collected,
      align: "right",
      cell: (r) => m(r, r.collected),
    },
    {
      key: "commission",
      header: c.commission,
      align: "right",
      cell: (r) => m(r, r.commission),
    },
    {
      key: "paid",
      header: c.paidOut,
      align: "right",
      cell: (r) => m(r, r.paidOut),
    },
    {
      key: "pending",
      header: c.pending,
      align: "right",
      cell: (r) => m(r, r.pending),
    },
  ];
  const columns: Column<Entity>[] =
    level === "overview"
      ? [
          first,
          {
            key: "branches",
            header: c.activeBranches,
            align: "right",
            cell: (r) => r.activeBranches ?? 0,
          },
          {
            key: "barbers",
            header: c.activeBarbers,
            align: "right",
            cell: (r) => r.activeBarbers ?? 0,
          },
          ...numbers,
          {
            key: "last",
            header: c.lastActivity,
            align: "right",
            cell: (r) => (r.lastAt ? formatDay(r.lastAt, locale) : "—"),
          },
        ]
      : level === "tenant"
        ? [
            first,
            {
              key: "barbers",
              header: c.activeBarbers,
              align: "right",
              cell: (r) => r.activeBarbers ?? 0,
            },
            ...numbers,
            {
              key: "lost",
              header: c.cancelled,
              align: "right",
              cell: (r) => `${r.cancelled} / ${r.noShow}`,
            },
          ]
        : [
            first,
            ...numbers,
            {
              key: "rate",
              header: c.rate,
              align: "right",
              cell: (r) =>
                r.commissionBps == null
                  ? t.earnings.rateMissing
                  : formatBps(r.commissionBps, locale),
            },
          ];
  const title = {
    overview: t.levels.tenants,
    tenant: t.levels.branches,
    branch: t.levels.barbers,
  }[level];

  return (
    <div className="grid gap-3">
      <h2 className="text-lg font-medium">{title}</h2>
      <Async query={query} t={t.states} isEmpty={(d) => d.rows.length === 0}>
        {(data) => (
          <div className="grid gap-4">
            <DataTable columns={columns} rows={data.rows} label={title} />
            <Pager
              page={page}
              total={data.total}
              limit={LIMIT}
              onPage={(p) => set({ page: String(p) }, true)}
              t={t.states}
            />
          </div>
        )}
      </Async>
    </div>
  );
}

/** Where you are in Overview → barbershop → branch → barber → cut, each step a way back up. */
function Breadcrumb({
  state,
  names,
  t,
}: {
  state: ReturnType<typeof useDashboardState>;
  names: ReturnType<typeof useOptions>;
  t: PlatformText;
}) {
  const { filters, set } = state;
  const find = (list: { id: string; name: string }[], id?: string) =>
    list.find((o) => o.id === id)?.name ?? "…";
  const trail: {
    key: string;
    label: string;
    patch: Record<string, undefined>;
  }[] = [
    {
      key: "overview",
      label: t.levels.overview,
      patch: {
        tenant: undefined,
        branch: undefined,
        barber: undefined,
        cut: undefined,
      },
    },
  ];
  if (filters.tenant) {
    trail.push({
      key: "tenant",
      label: find(names.tenants, filters.tenant),
      patch: { branch: undefined, barber: undefined, cut: undefined },
    });
  }
  if (filters.branch) {
    trail.push({
      key: "branch",
      label: find(names.branches, filters.branch),
      patch: { barber: undefined, cut: undefined },
    });
  }
  if (filters.barber) {
    trail.push({
      key: "barber",
      label: find(names.barbers, filters.barber),
      patch: { cut: undefined },
    });
  }

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {trail.map((step, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={step.key} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight
                  size={14}
                  aria-hidden="true"
                  className="text-fg-muted"
                />
              )}
              {last ? (
                <span aria-current="page" className="font-medium">
                  {step.label}
                </span>
              ) : (
                <button
                  type="button"
                  className="text-fg-muted underline-offset-4 hover:text-fg hover:underline"
                  onClick={() => set(step.patch)}
                >
                  {step.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function Dashboard({ locale, t }: { locale: Locale; t: PlatformText }) {
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const state = useDashboardState();
  const names = useOptions(state.filters);
  if (!hydrated) return null;
  const { view, set, filters } = state;
  const views: View[] = ["overview", "cuts", "earnings"];

  return (
    <div className="grid gap-6">
      <FilterBar state={state} t={t} names={names} />
      <Kpis filters={filters} locale={locale} t={t} />

      <div
        role="tablist"
        aria-label={t.tabs.label}
        className="flex gap-1 overflow-x-auto border-b border-line"
      >
        {views.map((v) => (
          <button
            key={v}
            id={`tab-${v}`}
            type="button"
            role="tab"
            aria-selected={view === v}
            aria-controls="view"
            onClick={() => set({ view: v === "overview" ? undefined : v })}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors ${view === v ? "border-accent font-medium text-fg" : "border-transparent text-fg-muted hover:text-fg"}`}
          >
            {t.tabs[v]}
          </button>
        ))}
      </div>

      <div
        id="view"
        role="tabpanel"
        aria-labelledby={`tab-${view}`}
        className="grid gap-4"
      >
        {view === "overview" && (
          <>
            <Breadcrumb state={state} names={names} t={t} />
            <Drill state={state} locale={locale} t={t} />
          </>
        )}
        {view === "cuts" && <CutsTable state={state} locale={locale} t={t} />}
        {view === "earnings" && (
          <Earnings
            scope="platform"
            filters={filters}
            date={state.date}
            page={state.page}
            locale={locale}
            t={t}
            onDate={(date) => set({ date })}
            onPage={(p) => set({ page: String(p) }, true)}
          />
        )}
      </div>

      {state.cut && (
        <CutDetail
          id={state.cut}
          locale={locale}
          t={t}
          onClose={() => set({ cut: undefined }, true)}
        />
      )}
    </div>
  );
}
