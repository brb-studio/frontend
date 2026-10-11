"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useTransition } from "react";
import type * as z from "zod";
import { adminRequest } from "@/features/admin/actions";
import { adminQuery } from "@/features/admin/api";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { platformWrite, type WriteResult } from "./actions";
import { formatBps, money } from "./format";
import {
  apiQuery,
  breakdownSchema,
  cutsSchema,
  type Entity,
  type Filters,
  platformQuery,
} from "./model";
import {
  Async,
  type Column,
  DataTable,
  field,
  fill,
  Modal,
  outlineButton,
  Pager,
  type PlatformText,
  solidButton,
} from "./ui";

const LIMIT = 25;

/** The global dashboard goes through /platform; a barbershop's admin panel through its own /v1/earnings. */
export type Scope = "platform" | "admin";

type WriteInput = Parameters<typeof platformWrite>[0];

const read = <S extends z.ZodType>(
  scope: Scope,
  kind: "breakdown" | "cuts",
  query: string,
  schema: S,
) =>
  scope === "platform"
    ? platformQuery(
        `${kind === "breakdown" ? "breakdown" : "appointments"}?${query}`,
        schema,
      )
    : adminQuery(
        `earnings${kind === "cuts" ? "/appointments" : ""}?${query}`,
        schema,
      );

async function send(scope: Scope, input: WriteInput): Promise<WriteResult> {
  if (scope === "platform") return platformWrite(input);
  const result =
    input.kind === "commission"
      ? await adminRequest({
          method: "PATCH",
          path: `earnings/barbers/${input.barberId}`,
          body: { commissionBps: input.commissionBps },
        })
      : await adminRequest({
          method: "POST",
          path: "earnings/payouts",
          body: {
            barberId: input.barberId,
            appointmentIds: input.appointmentIds,
            ...(input.reference ? { reference: input.reference } : {}),
          },
        });
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, code: result.code, message: result.message };
}

function Feedback({
  result,
  t,
}: {
  result?: WriteResult;
  t: PlatformText["earnings"];
}) {
  if (!result) return null;
  if (result.ok) {
    return (
      <p role="status" className="text-sm text-accent-text">
        {t.paidOk}
      </p>
    );
  }
  const message =
    (t.errors as Record<string, string>)[result.code] ?? t.errors.unknown;
  return (
    <p role="alert" className="text-sm text-danger">
      {message}
    </p>
  );
}

/** Pay a barber for specific completed cuts of the day. The amount is computed by the API from their commissions. */
function PayPanel({
  scope: where,
  barber,
  date,
  filters,
  locale,
  t,
  onClose,
}: {
  scope: Scope;
  barber: Entity;
  date: string;
  filters: Filters;
  locale: Locale;
  t: PlatformText;
  onClose: () => void;
}) {
  const e = t.earnings;
  const queryClient = useQueryClient();
  const scope: Filters = {
    from: date,
    to: date,
    tenant: barber.tenantId,
    branch: filters.branch,
    barber: barber.id,
    status: "completed",
  };
  const cuts = useQuery(
    read(where, "cuts", apiQuery(scope, { limit: 100 }), cutsSchema),
  );
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const [reference, setReference] = useState("");
  const [result, setResult] = useState<WriteResult>();
  const [pending, start] = useTransition();

  return (
    <Modal
      title={fill(e.payTitle, { name: barber.name })}
      closeLabel={e.close}
      onClose={onClose}
    >
      <p className="text-sm text-fg-muted">{e.payLead}</p>
      <Async query={cuts} t={t.states}>
        {(data) => {
          const payable = data.rows.filter(
            (r) => r.commission.state === "accrued",
          );
          const unconfigured = data.rows.some(
            (r) => r.commission.state === "unconfigured",
          );
          const chosen = picked ?? new Set(payable.map((r) => r.id));
          const total = payable
            .filter((r) => chosen.has(r.id))
            .reduce(
              (sum, r) =>
                sum +
                (r.commission.state === "accrued"
                  ? r.commission.amountMinor
                  : 0),
              0,
            );
          const currency = data.rows[0]?.currency ?? barber.currency;
          return (
            <div className="grid gap-4">
              {unconfigured && (
                <p role="alert" className="text-sm text-danger">
                  {e.errors.COMMISSION_NOT_CONFIGURED}
                </p>
              )}
              {payable.length === 0 ? (
                <p className="text-sm text-fg-muted">{e.noUnpaid}</p>
              ) : (
                <>
                  <label className="flex min-h-11 items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="size-5 accent-[var(--color-accent)]"
                      checked={chosen.size === payable.length}
                      onChange={(event) =>
                        setPicked(
                          new Set(
                            event.target.checked
                              ? payable.map((r) => r.id)
                              : [],
                          ),
                        )
                      }
                    />
                    {e.selectAll}
                  </label>
                  <ul className="grid gap-2">
                    {payable.map((r) => (
                      <li key={r.id}>
                        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-line px-3 py-2 text-sm">
                          <input
                            type="checkbox"
                            className="size-5 accent-[var(--color-accent)]"
                            checked={chosen.has(r.id)}
                            onChange={(event) => {
                              const next = new Set(chosen);
                              if (event.target.checked) next.add(r.id);
                              else next.delete(r.id);
                              setPicked(next);
                            }}
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {r.items
                              .map((i) => pick(i.name, locale))
                              .join(", ")}
                          </span>
                          <span className="tabular-nums text-fg-muted">
                            {money(r.totalMinor, r.currency, locale)}
                          </span>
                          <span className="tabular-nums">
                            {r.commission.state === "accrued"
                              ? money(
                                  r.commission.amountMinor,
                                  r.currency,
                                  locale,
                                )
                              : ""}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <div className="grid gap-2">
                    <label htmlFor="payout-ref" className="text-sm font-medium">
                      {e.reference}
                    </label>
                    <input
                      id="payout-ref"
                      className={field}
                      maxLength={120}
                      placeholder={e.referencePlaceholder}
                      value={reference}
                      onChange={(event) => setReference(event.target.value)}
                    />
                  </div>
                  <p className="flex items-baseline justify-between text-sm">
                    <span className="text-fg-muted">{e.total}</span>
                    <strong className="text-xl tabular-nums">
                      {money(total, currency, locale)}
                    </strong>
                  </p>
                  <Feedback result={result} t={e} />
                  <button
                    type="button"
                    className={solidButton}
                    disabled={pending || chosen.size === 0}
                    onClick={() =>
                      start(async () => {
                        const outcome = await send(where, {
                          kind: "payout",
                          barberId: barber.id,
                          appointmentIds: [...chosen],
                          reference,
                        });
                        setResult(outcome);
                        if (outcome.ok) {
                          setPicked(new Set());
                          await queryClient.invalidateQueries();
                        }
                      })
                    }
                  >
                    {pending ? e.saving : e.confirm}
                  </button>
                </>
              )}
            </div>
          );
        }}
      </Async>
    </Modal>
  );
}

/** The barber's commission rate: set it, change it, or remove it. Never defaulted. */
function RatePanel({
  scope: where,
  barber,
  locale,
  t,
  onClose,
}: {
  scope: Scope;
  barber: Entity;
  locale: Locale;
  t: PlatformText["earnings"];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [percent, setPercent] = useState(
    barber.commissionBps == null ? "" : String(barber.commissionBps / 100),
  );
  const [result, setResult] = useState<WriteResult>();
  const [pending, start] = useTransition();
  const parsed = Number(percent.replace(",", "."));
  const valid =
    percent.trim() !== "" &&
    Number.isFinite(parsed) &&
    parsed >= 0 &&
    parsed <= 100;

  const save = (commissionBps: number | null) =>
    start(async () => {
      const outcome = await send(where, {
        kind: "commission",
        barberId: barber.id,
        commissionBps,
      });
      setResult(outcome);
      if (outcome.ok) await queryClient.invalidateQueries();
    });

  return (
    <Modal
      title={`${t.rateTitle} · ${barber.name}`}
      closeLabel={t.close}
      onClose={onClose}
    >
      <p className="text-sm text-fg-muted">{t.rateLead}</p>
      <div className="grid gap-2">
        <label htmlFor="rate" className="text-sm font-medium">
          {t.ratePercent}
        </label>
        <input
          id="rate"
          inputMode="decimal"
          className={field}
          value={percent}
          onChange={(event) => setPercent(event.target.value)}
          aria-invalid={percent !== "" && !valid}
        />
        {barber.commissionBps != null && (
          <p className="text-sm text-fg-muted">
            {formatBps(barber.commissionBps, locale)}
          </p>
        )}
      </div>
      {result &&
        (result.ok ? (
          <p role="status" className="text-sm text-accent-text">
            {t.rateSaved}
          </p>
        ) : (
          <p role="alert" className="text-sm text-danger">
            {(t.errors as Record<string, string>)[result.code] ??
              t.errors.unknown}
          </p>
        ))}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={solidButton}
          disabled={pending || !valid}
          onClick={() => save(Math.round(parsed * 100))}
        >
          {pending ? t.saving : t.rateSave}
        </button>
        {barber.commissionBps != null && (
          <button
            type="button"
            className={outlineButton}
            disabled={pending}
            onClick={() => save(null)}
          >
            {t.rateClear}
          </button>
        )}
      </div>
    </Modal>
  );
}

/** Pick a day: every barber's cuts, sales, commission earned, paid and balance, with payment and rate actions. */
export function Earnings({
  scope,
  filters,
  date,
  page,
  locale,
  t,
  onDate,
  onPage,
}: {
  scope: Scope;
  filters: Filters;
  date: string;
  page: number;
  locale: Locale;
  t: PlatformText;
  onDate: (date: string) => void;
  onPage: (page: number) => void;
}) {
  const e = t.earnings;
  const day: Filters = { ...filters, from: date, to: date, status: undefined };
  const query = useQuery(
    read(
      scope,
      "breakdown",
      apiQuery(day, { by: "barber", page, limit: LIMIT }),
      breakdownSchema,
    ),
  );
  const [paying, setPaying] = useState<Entity>();
  const [rating, setRating] = useState<Entity>();

  const columns: Column<Entity>[] = [
    {
      key: "name",
      header: t.cols.barber,
      primary: true,
      cell: (r) => (
        <span className="grid">
          <span className="font-medium">{r.name}</span>
          <span className="text-xs text-fg-muted">
            {scope === "platform" ? `${r.tenantName} · ` : ""}
            {r.branchName}
          </span>
        </span>
      ),
    },
    {
      key: "cuts",
      header: t.cols.cuts,
      align: "right",
      cell: (r) => r.completed,
    },
    {
      key: "sales",
      header: t.cols.sales,
      align: "right",
      cell: (r) => money(r.sales, r.currency, locale),
    },
    {
      key: "commission",
      header: t.cols.commission,
      align: "right",
      cell: (r) => money(r.commission, r.currency, locale),
    },
    {
      key: "paid",
      header: t.cols.paidOut,
      align: "right",
      cell: (r) => money(r.paidOut, r.currency, locale),
    },
    {
      key: "pending",
      header: t.cols.pending,
      align: "right",
      cell: (r) => <strong>{money(r.pending, r.currency, locale)}</strong>,
    },
    {
      key: "rate",
      header: t.cols.rate,
      align: "right",
      cell: (r) => (
        <button
          type="button"
          className="underline-offset-4 hover:underline text-accent-text"
          onClick={() => setRating(r)}
        >
          {r.commissionBps == null
            ? e.setRate
            : formatBps(r.commissionBps, locale)}
        </button>
      ),
    },
    {
      key: "pay",
      header: "",
      align: "right",
      cell: (r) => (
        <button
          type="button"
          className={outlineButton}
          onClick={() => setPaying(r)}
        >
          {e.pay}
        </button>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h2 className="text-lg font-medium">{e.title}</h2>
          <p className="max-w-xl text-sm text-fg-muted">{e.lead}</p>
        </div>
        <div className="grid gap-1.5">
          <label
            htmlFor="earn-date"
            className="text-xs font-medium text-fg-muted"
          >
            {e.date}
          </label>
          <input
            id="earn-date"
            type="date"
            className={field}
            value={date}
            onChange={(ev) => ev.target.value && onDate(ev.target.value)}
          />
        </div>
      </div>
      <Async query={query} t={t.states} isEmpty={(d) => d.rows.length === 0}>
        {(data) => (
          <div className="grid gap-4">
            <DataTable columns={columns} rows={data.rows} label={e.title} />
            <Pager
              page={page}
              total={data.total}
              limit={LIMIT}
              onPage={onPage}
              t={t.states}
            />
          </div>
        )}
      </Async>
      {paying && (
        <PayPanel
          scope={scope}
          barber={paying}
          date={date}
          filters={filters}
          locale={locale}
          t={t}
          onClose={() => setPaying(undefined)}
        />
      )}
      {rating && (
        <RatePanel
          scope={scope}
          barber={rating}
          locale={locale}
          t={e}
          onClose={() => setRating(undefined)}
        />
      )}
    </div>
  );
}
