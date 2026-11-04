"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { Check, History, Receipt } from "lucide-react";
import { useState } from "react";
import * as z from "zod";
import {
  type CutRow,
  cutsSchema,
  type Entity,
} from "@/features/platform/model";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { formatMoney } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { adminQuery, useAdminAction } from "./api";
import { type AdminText, Panel, pill } from "./ui";

type Text = AdminText["barberPay"];
type Errors = Dictionary["platform"]["earnings"]["errors"];
const PAGE = 100;

export const payoutsQuery = (from: string, to: string) =>
  adminQuery(
    `earnings/payouts?from=${from}&to=${to}`,
    z.object({
      rows: z.array(
        z.object({
          id: z.string(),
          barberId: z.string(),
          barberName: z.string(),
          branchName: z.string(),
          currency: z.string(),
          amountMinor: z.number().int(),
          appointments: z.number().int(),
          reference: z.string().optional(),
          paidAt: z.string(),
        }),
      ),
    }),
  );

/** Every completed cut of one barber in the period, page by page (a month can pass 100). */
const cutsQuery = (barberId: string, from: string, to: string) =>
  queryOptions({
    queryKey: ["admin", "earnings/appointments", barberId, from, to],
    queryFn: async ({ signal }) => {
      const rows: CutRow[] = [];
      for (let page = 1; page <= 20; page++) {
        const q = new URLSearchParams({
          from,
          to,
          barberId,
          status: "completed",
          page: String(page),
          limit: String(PAGE),
        });
        const response = await fetch(`/api/admin/earnings/appointments?${q}`, {
          signal,
        });
        if (!response.ok) throw new Error(`cuts ${response.status}`);
        const data = cutsSchema.parse(await response.json());
        rows.push(...data.rows);
        if (rows.length >= data.total || data.rows.length < PAGE) break;
      }
      return rows;
    },
  });

const errorOf = (code: string, errors: Errors) =>
  (errors as Record<string, string>)[code] ?? errors.unknown;

/** Pay one barber what the period owes: every unpaid cut ticked, a reference, and a confirmation. */
export function PayPanel({
  barber,
  from,
  to,
  locale,
  t,
  errors,
  onDone,
}: {
  barber: Entity;
  from: string;
  to: string;
  locale: Locale;
  t: Text;
  errors: Errors;
  onDone: (message: string) => void;
}) {
  const cuts = useQuery(cutsQuery(barber.id, from, to));
  const action = useAdminAction();
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const [reference, setReference] = useState("");
  const [asking, setAsking] = useState(false);
  const payable = (cuts.data ?? []).filter(
    (r) => r.commission.state === "accrued",
  );
  const chosen = picked ?? new Set(payable.map((r) => r.id));
  const commissionOf = (r: CutRow) =>
    r.commission.state === "accrued" ? r.commission.amountMinor : 0;
  const total = payable
    .filter((r) => chosen.has(r.id))
    .reduce((sum, r) => sum + commissionOf(r), 0);
  const money = (minor: number) => formatMoney(minor, barber.currency, locale);
  const when = (iso: string, timeZone: string) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).format(new Date(iso));
  const toggle = (id: string, on: boolean) => {
    const next = new Set(chosen);
    if (on) next.add(id);
    else next.delete(id);
    setPicked(next);
  };
  const confirm = () =>
    action.mutate(
      {
        method: "POST",
        path: "earnings/payouts",
        body: {
          barberId: barber.id,
          appointmentIds: [...chosen],
          ...(reference.trim() ? { reference: reference.trim() } : {}),
        },
      },
      {
        onSuccess: (result) => {
          setAsking(false);
          if (result.ok)
            onDone(
              t.paidDone
                .replace("{name}", barber.name)
                .replace("{amount}", money(total))
                .replace("{n}", String(chosen.size)),
            );
        },
      },
    );

  if (cuts.isPending)
    return <p className="text-sm text-fg-muted">{t.loading}</p>;
  if (cuts.isError) return <p className="text-sm text-danger">{t.failed}</p>;
  if (payable.length === 0)
    return <p className="text-sm text-fg-muted">{t.nothingToPay}</p>;

  return (
    <div className="grid gap-4">
      <p className="-mt-2 text-sm text-fg-muted">{t.payLead}</p>
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          className="min-h-9 rounded-full border border-line px-3 hover:border-accent"
          onClick={() => setPicked(new Set(payable.map((r) => r.id)))}
        >
          {t.selectAll}
        </button>
        <button
          type="button"
          className="min-h-9 rounded-full border border-line px-3 hover:border-accent"
          onClick={() => setPicked(new Set())}
        >
          {t.selectNone}
        </button>
      </div>
      <ul className="grid max-h-96 gap-2 overflow-y-auto pr-1">
        {payable.map((r) => {
          const on = chosen.has(r.id);
          return (
            <li key={r.id}>
              <label
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2 text-sm ${on ? "border-accent bg-card" : "border-line bg-surface"}`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(event) => toggle(r.id, event.target.checked)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`grid size-6 shrink-0 place-items-center rounded-lg border ${on ? "border-accent bg-accent text-accent-fg" : "border-line-strong"}`}
                >
                  {on && <Check size={14} />}
                </span>
                <span className="grid min-w-0 flex-1">
                  <span className="truncate">
                    {r.items.map((i) => pick(i.name, locale)).join(" + ")}
                  </span>
                  <span className="text-xs text-fg-muted capitalize">
                    {when(r.startAt, r.timeZone)} · {money(r.totalMinor)}
                  </span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {money(commissionOf(r))}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <Field
        name="reference"
        label={t.reference}
        hint={t.referenceHint}
        maxLength={120}
        value={reference}
        onChange={(event) => setReference(event.target.value)}
      />
      <p className="flex items-baseline justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
        <span className="text-sm text-fg-muted">
          {t.payTotal} ·{" "}
          {chosen.size === 1
            ? t.cutsOne
            : t.cuts.replace("{n}", String(chosen.size))}
        </span>
        <strong className="text-2xl tabular-nums">{money(total)}</strong>
      </p>
      {asking ? (
        <div
          role="alertdialog"
          className="grid gap-3 rounded-2xl border border-accent p-4"
        >
          <p className="font-medium">
            {t.confirmAsk
              .replace("{amount}", money(total))
              .replace("{name}", barber.name)
              .replace("{n}", String(chosen.size))}
          </p>
          <p className="text-xs text-fg-muted">{t.cannotUndo}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              autoFocus
              onClick={() => setAsking(false)}
            >
              {t.back}
            </Button>
            <Button disabled={action.isPending} onClick={confirm}>
              {t.yesPay}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          disabled={chosen.size === 0 || total === 0}
          onClick={() => setAsking(true)}
          className="sm:w-fit"
        >
          {t.pay.replace("{amount}", money(total))}
        </Button>
      )}
      {action.data && !action.data.ok && (
        <p role="alert" className="text-sm text-danger">
          {errorOf(action.data.code, errors)}
        </p>
      )}
    </div>
  );
}

const RATE_PRESETS = [30, 40, 45, 50, 60];

/** A barber's commission rate: one-tap common rates, any other typed, or none. */
export function RatePanel({
  barber,
  locale,
  t,
  errors,
  onDone,
}: {
  barber: Entity;
  locale: Locale;
  t: Text;
  errors: Errors;
  onDone: (message: string) => void;
}) {
  const action = useAdminAction();
  const [percent, setPercent] = useState(
    barber.commissionBps == null ? "" : String(barber.commissionBps / 100),
  );
  const parsed = Number(percent.replace(",", "."));
  const valid =
    percent.trim() !== "" &&
    Number.isFinite(parsed) &&
    parsed >= 0 &&
    parsed <= 100;
  const save = (bps: number | null) =>
    action.mutate(
      {
        method: "PATCH",
        path: `earnings/barbers/${barber.id}`,
        body: { commissionBps: bps },
      },
      {
        onSuccess: (result) =>
          result.ok &&
          onDone(
            bps === null
              ? t.rateCleared.replace("{name}", barber.name)
              : t.rateSaved.replace("{name}", barber.name).replace(
                  "{n}",
                  new Intl.NumberFormat(locale, {
                    maximumFractionDigits: 2,
                  }).format(bps / 100),
                ),
          ),
      },
    );
  return (
    <div className="grid gap-3">
      <p className="-mt-2 text-sm text-fg-muted">{t.rateLead}</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-fg-muted">{t.quick}</span>
        {RATE_PRESETS.map((p) => (
          <label key={p} className={pill}>
            <input
              type="radio"
              name="rate"
              checked={parsed === p && percent.trim() !== ""}
              onChange={() => setPercent(String(p))}
              className="sr-only"
            />
            {p} %
          </label>
        ))}
      </div>
      <Field
        name="percent"
        label="%"
        inputMode="decimal"
        value={percent}
        onChange={(event) => setPercent(event.target.value)}
        aria-invalid={percent !== "" && !valid}
        className="sm:max-w-40"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={action.isPending || !valid}
          onClick={() => save(Math.round(parsed * 100))}
        >
          {t.rateSave}
        </Button>
        {barber.commissionBps != null && (
          <Button
            variant="secondary"
            disabled={action.isPending}
            onClick={() => save(null)}
          >
            {t.rateClear}
          </Button>
        )}
      </div>
      {action.data && !action.data.ok && (
        <p role="alert" className="text-sm text-danger">
          {errorOf(action.data.code, errors)}
        </p>
      )}
    </div>
  );
}

/** The payments recorded in the period: when, to whom, how much, how many cuts, the reference. */
export function PayoutHistory({
  from,
  to,
  locale,
  t,
}: {
  from: string;
  to: string;
  locale: Locale;
  t: Text;
}) {
  const history = useQuery(payoutsQuery(from, to));
  const rows = history.data?.rows ?? [];
  const when = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  return (
    <Panel title={t.history}>
      {history.isPending ? (
        <p className="text-sm text-fg-muted">{t.loading}</p>
      ) : rows.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <History size={16} aria-hidden="true" />
          {t.historyEmpty}
        </p>
      ) : (
        <ul className="grid gap-2">
          {rows.map((p) => (
            <li
              key={p.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5 text-sm"
            >
              <Receipt
                size={18}
                aria-hidden="true"
                className="text-accent-text"
              />
              <span className="grid min-w-0">
                <span className="truncate font-medium">
                  {p.barberName}
                  <span className="font-normal text-fg-muted">
                    {" "}
                    · {p.branchName}
                  </span>
                </span>
                <span className="truncate text-xs text-fg-muted capitalize">
                  {when(p.paidAt)} ·{" "}
                  {p.appointments === 1
                    ? t.cutsOne
                    : t.cuts.replace("{n}", String(p.appointments))}
                  {p.reference && ` · ${p.reference}`}
                </span>
              </span>
              <span className="font-semibold tabular-nums">
                {formatMoney(p.amountMinor, p.currency, locale)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
