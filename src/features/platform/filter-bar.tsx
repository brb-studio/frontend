"use client";

import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useId } from "react";
import {
  daysAgo,
  monthStart,
  optionsSchema,
  platformQuery,
  STATUSES,
  today,
} from "./model";
import { field, outlineButton, type PlatformText } from "./ui";
import type { useDashboardState } from "./use-filters";

type State = ReturnType<typeof useDashboardState>;

function Labeled({
  label,
  children,
}: {
  label: string;
  children: (id: string) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-fg-muted">
        {label}
      </label>
      {children(id)}
    </div>
  );
}

export function FilterBar({
  state,
  t,
  names,
}: {
  state: State;
  t: PlatformText;
  names: {
    tenants: { id: string; name: string }[];
    branches: { id: string; name: string }[];
    barbers: { id: string; name: string }[];
  };
}) {
  const { filters, set } = state;
  const dirty = Boolean(
    filters.tenant || filters.branch || filters.barber || filters.status,
  );
  const f = t.filters;
  const presets = [
    { label: f.today, from: today() },
    { label: f.week, from: daysAgo(6) },
    { label: f.month, from: monthStart() },
  ];

  return (
    <section
      aria-label={f.label}
      className="grid gap-4 rounded-3xl border border-line bg-card p-4 md:p-5"
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <Labeled label={f.from}>
          {(id) => (
            <input
              id={id}
              type="date"
              className={field}
              value={filters.from}
              max={filters.to}
              onChange={(e) => e.target.value && set({ from: e.target.value })}
            />
          )}
        </Labeled>
        <Labeled label={f.to}>
          {(id) => (
            <input
              id={id}
              type="date"
              className={field}
              value={filters.to}
              min={filters.from}
              onChange={(e) => e.target.value && set({ to: e.target.value })}
            />
          )}
        </Labeled>
        <Labeled label={f.tenant}>
          {(id) => (
            <select
              id={id}
              className={field}
              value={filters.tenant ?? ""}
              onChange={(e) =>
                set({
                  tenant: e.target.value || undefined,
                  branch: undefined,
                  barber: undefined,
                })
              }
            >
              <option value="">{f.all}</option>
              {names.tenants.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          )}
        </Labeled>
        <Labeled label={f.branch}>
          {(id) => (
            <select
              id={id}
              className={field}
              value={filters.branch ?? ""}
              disabled={!filters.tenant}
              onChange={(e) =>
                set({ branch: e.target.value || undefined, barber: undefined })
              }
            >
              <option value="">{f.all}</option>
              {names.branches.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          )}
        </Labeled>
        <Labeled label={f.barber}>
          {(id) => (
            <select
              id={id}
              className={field}
              value={filters.barber ?? ""}
              disabled={!filters.tenant}
              onChange={(e) => set({ barber: e.target.value || undefined })}
            >
              <option value="">{f.all}</option>
              {names.barbers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          )}
        </Labeled>
        <Labeled label={f.status}>
          {(id) => (
            <select
              id={id}
              className={field}
              value={filters.status ?? ""}
              onChange={(e) => set({ status: e.target.value || undefined })}
            >
              <option value="">{f.all}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t.status[s]}
                </option>
              ))}
            </select>
          )}
        </Labeled>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            className={outlineButton}
            onClick={() => set({ from: p.from, to: today() })}
          >
            {p.label}
          </button>
        ))}
        {dirty && (
          <button
            type="button"
            className={`${outlineButton} text-fg-muted`}
            onClick={() =>
              set({
                tenant: undefined,
                branch: undefined,
                barber: undefined,
                status: undefined,
              })
            }
          >
            <X size={16} aria-hidden="true" />
            {f.clear}
          </button>
        )}
      </div>
    </section>
  );
}

export function useOptions(filters: { tenant?: string; branch?: string }) {
  const q = new URLSearchParams();
  if (filters.tenant) q.set("tenantId", filters.tenant);
  if (filters.branch) q.set("branchId", filters.branch);

  const branches = useQuery(
    platformQuery(
      `options${filters.tenant ? `?tenantId=${filters.tenant}` : ""}`,
      optionsSchema,
    ),
  );
  const barbers = useQuery(platformQuery(`options?${q}`, optionsSchema));
  return {
    tenants: branches.data?.tenants ?? [],
    branches: branches.data?.branches ?? [],
    barbers: barbers.data?.barbers ?? [],
  };
}
