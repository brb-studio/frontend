"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CircleCheck,
  HandCoins,
  MapPin,
  Percent,
  Scissors,
  TriangleAlert,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { breakdownSchema, type Entity } from "@/features/platform/model";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { EntityCard, Fact, Notice } from "./admin-kit";
import { today } from "./agenda-manager";
import { adminQuery } from "./api";
import { PayoutHistory, PayPanel, RatePanel } from "./barber-pay-panels";
import { initials } from "./initials";
import {
  owedFirst,
  PAY_PERIODS,
  type PayPeriod,
  payRange,
  payTotals,
} from "./pay-view";
import { type AdminText, Panel, pill } from "./ui";

type Open = { kind: "pay" | "rate"; barber: Entity } | null;

/**
 * Paying barbers inside one barbershop: a pay period (week, fortnight, month or any range), what is
 * owed in total, one card per barber with what they earned, were paid and are owed, paying in one step
 * with a confirmation, their rate, and the payments recorded in the period.
 */
export function EarningsManager({
  locale,
  t,
  errors,
}: {
  locale: Locale;
  t: AdminText;
  errors: Dictionary["platform"]["earnings"]["errors"];
}) {
  const text = t.barberPay;
  const [period, setPeriod] = useState<PayPeriod>("week");
  const [custom, setCustom] = useState(() => payRange("week", today()));
  const range = period === "custom" ? custom : payRange(period, today());
  const { from, to } = range;
  const query = useQuery(
    adminQuery(`earnings?from=${from}&to=${to}&limit=100`, breakdownSchema),
  );
  const [open, setOpen] = useState<Open>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const rows = owedFirst(query.data?.rows ?? []);
  const totals = payTotals(rows);
  const currency = rows[0]?.currency ?? "MXN";
  const money = (minor: number) => formatMoney(minor, currency, locale);
  const label = (p: PayPeriod) =>
    p === "fortnight"
      ? text.fortnight
      : p === "custom"
        ? text.custom
        : t.revenue.periods[p];
  const show = (next: Open) => {
    setNotice(null);
    setOpen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const rateText = (bps: number) =>
    text.rate.replace(
      "{n}",
      new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
        bps / 100,
      ),
    );

  return (
    <div className="grid gap-5">
      <p className="-mt-3 max-w-2xl text-sm text-fg-muted">{text.lead}</p>
      <Notice
        message={notice}
        closeLabel={t.common.close}
        onClose={() => setNotice(null)}
      />

      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">{t.revenue.period}</legend>
        {PAY_PERIODS.map((p) => (
          <label key={p} className={pill}>
            <input
              type="radio"
              name="pay-period"
              className="sr-only"
              checked={period === p}
              onChange={() => {
                setPeriod(p);
                setOpen(null);
              }}
            />
            {label(p)}
          </label>
        ))}
      </fieldset>
      {period === "custom" && (
        <div className="grid gap-3 sm:max-w-md sm:grid-cols-2">
          <Field
            name="from"
            type="date"
            label={text.from}
            value={custom.from}
            max={custom.to}
            onChange={(e) =>
              e.target.value &&
              setCustom((c) => ({ ...c, from: e.target.value }))
            }
          />
          <Field
            name="to"
            type="date"
            label={text.to}
            value={custom.to}
            min={custom.from}
            onChange={(e) =>
              e.target.value && setCustom((c) => ({ ...c, to: e.target.value }))
            }
          />
        </div>
      )}

      {open && (
        <Panel
          title={
            open.kind === "pay"
              ? text.payTitle.replace("{name}", open.barber.name)
              : text.rateTitle.replace("{name}", open.barber.name)
          }
          action={
            <Button variant="secondary" onClick={() => setOpen(null)}>
              <X size={18} aria-hidden="true" />
              {t.common.close}
            </Button>
          }
        >
          {open.kind === "pay" ? (
            <PayPanel
              key={`${open.barber.id}:${from}:${to}`}
              barber={open.barber}
              from={from}
              to={to}
              locale={locale}
              t={text}
              errors={errors}
              onDone={(message) => {
                setOpen(null);
                setNotice(message);
              }}
            />
          ) : (
            <RatePanel
              key={open.barber.id}
              barber={open.barber}
              locale={locale}
              t={text}
              errors={errors}
              onDone={(message) => {
                setOpen(null);
                setNotice(message);
              }}
            />
          )}
        </Panel>
      )}

      {query.isError ? (
        <p role="alert" className="text-sm text-danger">
          {text.failed}
        </p>
      ) : query.isPending ? (
        <p className="text-fg-muted">{text.loading}</p>
      ) : (
        <>
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1 rounded-3xl border border-accent bg-card p-4">
              <dt className="flex items-center gap-2 text-sm text-fg-muted">
                <Wallet size={16} aria-hidden="true" />
                {text.pendingTotal}
              </dt>
              <dd className="text-3xl font-semibold tabular-nums">
                {money(totals.pending)}
              </dd>
              <dd className="text-sm text-fg-muted">
                {totals.owed === 0
                  ? text.allPaid
                  : totals.owed === 1
                    ? text.owedOne
                    : text.owedCount.replace("{n}", String(totals.owed))}
              </dd>
            </div>
            <div className="grid gap-1 rounded-3xl border border-line bg-card p-4">
              <dt className="flex items-center gap-2 text-sm text-fg-muted">
                <CircleCheck size={16} aria-hidden="true" />
                {text.paidTotal}
              </dt>
              <dd className="text-2xl font-semibold tabular-nums">
                {money(totals.paidOut)}
              </dd>
            </div>
            <div className="grid gap-1 rounded-3xl border border-line bg-card p-4">
              <dt className="flex items-center gap-2 text-sm text-fg-muted">
                <HandCoins size={16} aria-hidden="true" />
                {text.commissionTotal}
              </dt>
              <dd className="text-2xl font-semibold tabular-nums">
                {money(totals.commission)}
              </dd>
            </div>
          </dl>

          {totals.unconfigured.length > 0 && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-2xl border border-danger/40 px-4 py-3 text-sm text-danger"
            >
              <TriangleAlert
                size={16}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
              />
              {text.unconfiguredWarn.replace(
                "{names}",
                totals.unconfigured.join(", "),
              )}
            </p>
          )}

          <ul className="grid gap-3">
            {rows.map((b) => {
              const share =
                b.commission > 0
                  ? Math.min(100, Math.round((b.paidOut / b.commission) * 100))
                  : 0;
              return (
                <EntityCard
                  key={b.id}
                  icon={UserRound}
                  badge={initials(b.name)}
                  title={b.name}
                  highlight={b.pending > 0}
                  muted={b.active === false}
                  aside={
                    <span className="grid justify-items-end">
                      <span className="text-xs text-fg-muted">
                        {b.pending > 0 ? text.owes : text.upToDate}
                      </span>
                      <span
                        className={`text-xl font-semibold tabular-nums ${b.pending > 0 ? "" : "text-fg-muted"}`}
                      >
                        {money(b.pending)}
                      </span>
                    </span>
                  }
                  actions={
                    <>
                      <Button
                        disabled={b.pending <= 0}
                        onClick={() => show({ kind: "pay", barber: b })}
                      >
                        <Wallet size={18} aria-hidden="true" />
                        {text.pay.replace("{amount}", money(b.pending))}
                      </Button>
                      <button
                        type="button"
                        onClick={() => show({ kind: "rate", barber: b })}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line px-4 text-sm hover:border-accent"
                      >
                        <Percent size={14} aria-hidden="true" />
                        {b.commissionBps == null ? text.setRate : text.editRate}
                      </button>
                    </>
                  }
                >
                  <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                    {b.branchName && <Fact icon={MapPin}>{b.branchName}</Fact>}
                    {b.commissionBps == null ? (
                      <Fact icon={TriangleAlert} tone="warn">
                        {text.noRate}
                      </Fact>
                    ) : (
                      <Fact icon={Percent}>{rateText(b.commissionBps)}</Fact>
                    )}
                    <Fact icon={Scissors}>
                      {b.completed === 1
                        ? text.cutsOne
                        : text.cuts.replace("{n}", String(b.completed))}
                    </Fact>
                  </p>
                  <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-fg-muted tabular-nums">
                    <span>
                      {text.sales.replace("{amount}", money(b.sales))}
                    </span>
                    <span>
                      {text.commission.replace("{amount}", money(b.commission))}
                    </span>
                    <span>
                      {text.paid.replace("{amount}", money(b.paidOut))}
                    </span>
                  </p>
                  {b.commission > 0 && (
                    <div
                      className="mt-1 h-1.5 max-w-sm overflow-hidden rounded-full bg-line"
                      role="img"
                      aria-label={`${share} %`}
                    >
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  )}
                </EntityCard>
              );
            })}
          </ul>
        </>
      )}

      <PayoutHistory from={from} to={to} locale={locale} t={text} />
    </div>
  );
}
