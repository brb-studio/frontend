"use client";

import { useQuery } from "@tanstack/react-query";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { CommissionBadge, formatWhen, money } from "./format";
import { apiQuery, type CutRow, cutsSchema, platformQuery } from "./model";
import {
  Async,
  type Column,
  DataTable,
  Pager,
  type PlatformText,
  StatusBadge,
} from "./ui";
import type { useDashboardState } from "./use-filters";

const LIMIT = 25;

const statusTone = {
  completed: "ok",
  confirmed: "warn",
  cancelled: "muted",
  no_show: "bad",
} as const;

const paymentTone = {
  paid: "ok",
  pending: "warn",
  refunded: "warn",
  rejected: "bad",
  expired: "bad",
  failed: "bad",
} as const;

export function CutsTable({
  state,
  locale,
  t,
}: {
  state: ReturnType<typeof useDashboardState>;
  locale: Locale;
  t: PlatformText;
}) {
  const { filters, page, set } = state;
  const query = useQuery(
    platformQuery(
      `appointments?${apiQuery(filters, { page, limit: LIMIT })}`,
      cutsSchema,
    ),
  );
  const c = t.cols;

  const columns: Column<CutRow>[] = [
    {
      key: "date",
      header: c.date,
      primary: true,
      cell: (r) => (
        <button
          type="button"
          className="text-left font-medium underline-offset-4 hover:text-accent-text hover:underline"
          onClick={() => set({ cut: r.id }, true)}
        >
          {formatWhen(r.startAt, r.timeZone, locale)}
        </button>
      ),
    },
    { key: "tenant", header: c.tenant, cell: (r) => r.tenantName },
    { key: "branch", header: c.branch, cell: (r) => r.branchName },
    { key: "barber", header: c.barber, cell: (r) => r.barberName },
    {
      key: "service",
      header: c.service,
      cell: (r) => r.items.map((i) => pick(i.name, locale)).join(", "),
    },
    {
      key: "price",
      header: c.price,
      align: "right",
      cell: (r) => money(r.totalMinor, r.currency, locale),
    },
    {
      key: "payment",
      header: c.payment,
      cell: (r) => (
        <StatusBadge
          tone={
            r.payment
              ? (paymentTone[r.payment.status as keyof typeof paymentTone] ??
                "muted")
              : "muted"
          }
        >
          {r.payment
            ? (t.payment[r.payment.status as keyof PlatformText["payment"]] ??
              r.payment.status)
            : t.payment.none}
        </StatusBadge>
      ),
    },
    {
      key: "status",
      header: c.status,
      cell: (r) => (
        <StatusBadge tone={statusTone[r.status]}>
          {t.status[r.status]}
        </StatusBadge>
      ),
    },
    {
      key: "commission",
      header: c.commission,
      align: "right",
      cell: (r) =>
        r.commission.state === "accrued" || r.commission.state === "paid" ? (
          <span className="grid justify-items-end gap-1">
            {money(r.commission.amountMinor, r.currency, locale)}
            <CommissionBadge view={r.commission} t={t.commissionState} />
          </span>
        ) : (
          <CommissionBadge view={r.commission} t={t.commissionState} />
        ),
    },
  ];

  return (
    <div className="grid gap-3">
      <h2 className="text-lg font-medium">{t.levels.cuts}</h2>
      <Async query={query} t={t.states} isEmpty={(d) => d.rows.length === 0}>
        {(data) => (
          <div className="grid gap-4">
            <DataTable
              columns={columns}
              rows={data.rows}
              label={t.levels.cuts}
            />
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
