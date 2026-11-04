"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  Check,
  Circle,
  CreditCard,
  ExternalLink,
  Landmark,
  type LucideIcon,
  RefreshCw,
  Smartphone,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form";
import { adminQuery, useAdminAction } from "./api";
import { connectStep, depositFor } from "./money-view";
import { connectSchema } from "./schemas";
import { type AdminText, Panel, pill, Result, Toggle } from "./ui";

const connectQuery = adminQuery("payments/stripe", connectSchema);

/** Stripe's codes for what it still needs, in words (anything else reads as "pending detail"). */
const REQUIREMENT_LABEL: Record<
  string,
  "requirementBusinessUrl" | "requirementBankAccount" | "requirementTerms"
> = {
  "defaults.profile.business_url": "requirementBusinessUrl",
  "business_profile.url": "requirementBusinessUrl",
  external_account: "requirementBankAccount",
  "identity.attestations.terms_of_service.account.date": "requirementTerms",
  "tos_acceptance.date": "requirementTerms",
};

const urlOf = (data: unknown) =>
  typeof data === "object" &&
  data !== null &&
  "url" in data &&
  typeof data.url === "string" &&
  data.url.startsWith("https://")
    ? data.url
    : undefined;

/** Deposit percentages offered as one tap. */
const PRESETS = [20, 30, 50, 100];
/** A typical service, to show what the deposit means in money. */
const SAMPLE_MINOR = 30_000;

function DepositForm({
  deposit,
  currency,
  locale,
  t,
}: {
  deposit: { enabled: boolean; percentBps: number };
  currency: string;
  locale: Locale;
  t: AdminText;
}) {
  const action = useAdminAction();
  const [enabled, setEnabled] = useState(deposit.enabled);
  const [percent, setPercent] = useState(String(deposit.percentBps / 100));
  const text = t.payments.online.deposit;
  const online = t.payments.online;
  const bps = Math.round(Number(percent) * 100);
  const valid =
    Number.isInteger(Number(percent)) && bps >= 100 && bps <= 10_000;
  const amount = valid ? depositFor(SAMPLE_MINOR, bps, currency) : null;
  const money = (minor: number) => formatMoney(minor, currency, locale);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    action.mutate({
      method: "PATCH",
      path: "payments/deposit",
      body: { enabled, percentBps: bps },
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-3 border-t border-line pt-4">
      <p className="flex items-center gap-2 font-medium">
        <Wallet size={18} aria-hidden="true" className="text-accent-text" />
        {text.title}
      </p>
      <Toggle label={text.enabled} checked={enabled} onChange={setEnabled} />
      {enabled ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-fg-muted">{online.quick}</span>
            {PRESETS.map((p) => (
              <label key={p} className={pill}>
                <input
                  type="radio"
                  name="preset"
                  checked={Number(percent) === p}
                  onChange={() => setPercent(String(p))}
                  className="sr-only"
                />
                {p} %
              </label>
            ))}
          </div>
          <Field
            name="percent"
            label={text.percent}
            type="number"
            inputMode="decimal"
            min={1}
            max={100}
            step={1}
            required
            value={percent}
            onChange={(event) => setPercent(event.target.value)}
            className="sm:max-w-56"
          />
          {amount !== null && (
            <p className="rounded-2xl border border-accent bg-card px-4 py-3 text-sm">
              {(amount >= SAMPLE_MINOR ? online.exampleFull : online.example)
                .replace("{price}", money(SAMPLE_MINOR))
                .replace("{amount}", money(amount))}
            </p>
          )}
          <p className="text-xs text-fg-muted">{text.hint}</p>
        </>
      ) : (
        <p className="text-sm text-fg-muted">{online.depositOff}</p>
      )}
      {action.data && <Result result={action.data} t={t.common} />}
      <Button
        type="submit"
        disabled={action.isPending || (enabled && !valid)}
        className="sm:w-fit"
      >
        {t.common.save}
      </Button>
    </form>
  );
}

/**
 * Card and transfer payments through Stripe Connect: the owner fills Stripe's own form once (RFC,
 * identity, CLABE) and comes back. The state shown always comes from Stripe, never from the return.
 */
export function OnlinePayments({
  locale,
  stripeReturn,
  t,
}: {
  locale: Locale;
  /** `return` or `refresh`, when Stripe just sent the owner back here. */
  stripeReturn?: "return" | "refresh";
  t: AdminText;
}) {
  const queryClient = useQueryClient();
  // Back from Stripe the account is often still being reviewed: keep asking until it settles.
  const connect = useQuery({
    ...connectQuery,
    refetchInterval: (query) =>
      stripeReturn &&
      (query.state.data?.status === "onboarding" ||
        query.state.data?.status === "pending")
        ? 5_000
        : false,
  });
  const onboarding = useAdminAction();
  const refresh = useAdminAction();
  /** Reads the account from Stripe now and shows what came back, without waiting for a refetch. */
  const checkStatus = () =>
    refresh.mutate(
      { method: "POST", path: "payments/stripe/refresh" },
      {
        onSuccess: (result) => {
          if (!result.ok) return;
          const fresh = connectSchema.safeParse(result.data);
          if (fresh.success) {
            queryClient.setQueryData(connectQuery.queryKey, fresh.data);
          }
        },
      },
    );
  const dashboard = useAdminAction();
  const text = t.payments.online;
  const handled = useRef(false);

  const startOnboarding = () =>
    onboarding.mutate(
      { method: "POST", path: "payments/stripe/onboarding", body: { locale } },
      {
        onSuccess: (result) => {
          const url = result.ok ? urlOf(result.data) : undefined;
          if (url) window.location.assign(url);
        },
      },
    );

  // Back from Stripe: read the account again. An expired link (`refresh`) asks Stripe for a new one.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once per return from Stripe; the mutations are stable enough and re-running would open Stripe twice.
  useEffect(() => {
    if (handled.current || !stripeReturn) return;
    handled.current = true;
    if (stripeReturn === "refresh") startOnboarding();
    else checkStatus();
  }, [stripeReturn]);

  const data = connect.data;
  if (!data) return null;
  const status = text.status[data.status];
  const step = connectStep(data.status);
  const tone =
    data.status === "active"
      ? "border-accent bg-accent text-accent-fg"
      : data.status === "restricted"
        ? "border-danger/60 text-danger"
        : "border-line text-fg-muted";
  const steps = [text.stepSignup, text.stepReview, text.stepLive];
  const how: [LucideIcon, string][] = [
    [Smartphone, text.how1],
    [CalendarCheck, text.how2],
    [Landmark, text.how3],
  ];

  return (
    <Panel
      title={text.title}
      action={
        data.available ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${tone}`}
          >
            <CreditCard size={14} aria-hidden="true" />
            {status}
          </span>
        ) : undefined
      }
    >
      <ul className="grid gap-2 sm:grid-cols-3">
        {how.map(([Icon, line]) => (
          <li
            key={line}
            className="flex items-start gap-2 rounded-2xl border border-line bg-surface p-3 text-sm"
          >
            <Icon
              size={18}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-accent-text"
            />
            {line}
          </li>
        ))}
      </ul>
      {!data.available ? (
        <p className="text-sm">{text.unavailable}</p>
      ) : (
        <>
          <ol className="grid grid-cols-3 gap-2" aria-label={text.title}>
            {steps.map((label, i) => {
              const done = step > i + 1 || step === 3;
              const current = step === i + 1 && step !== 3;
              return (
                <li key={label} className="grid gap-1.5">
                  <span
                    className={`h-1.5 rounded-full ${done ? "bg-accent" : current ? (data.status === "restricted" ? "bg-danger" : "bg-accent/50") : "bg-line"}`}
                  />
                  <span
                    className={`inline-flex items-center gap-1 text-xs ${done || current ? "text-fg" : "text-fg-muted"}`}
                    aria-current={current ? "step" : undefined}
                  >
                    {done && <Check size={12} aria-hidden="true" />}
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
          {stripeReturn === "return" && data.status !== "active" && (
            <p role="status" className="text-sm text-fg-muted">
              {text.returned}
            </p>
          )}
          {data.requirementsDue.length > 0 && data.status !== "none" && (
            <div className="grid gap-2 rounded-2xl border border-danger/40 p-3 text-sm">
              <p className="flex items-center gap-2 font-medium text-danger">
                <TriangleAlert size={16} aria-hidden="true" />
                {text.requirements}:
              </p>
              <ul className="grid gap-1">
                {data.requirementsDue.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-fg-muted"
                  >
                    <Circle size={10} aria-hidden="true" />
                    {REQUIREMENT_LABEL[item]
                      ? text[REQUIREMENT_LABEL[item]]
                      : text.requirementOther}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {data.status !== "active" && (
              <Button onClick={startOnboarding} disabled={onboarding.isPending}>
                <CreditCard size={18} aria-hidden="true" />
                {data.status === "none" ? text.activate : text.continue}
              </Button>
            )}
            {data.status !== "none" && (
              <Button
                variant="secondary"
                disabled={refresh.isPending}
                onClick={checkStatus}
              >
                <RefreshCw size={16} aria-hidden="true" />
                {text.refresh}
              </Button>
            )}
            {data.status !== "none" && data.status !== "onboarding" && (
              <Button
                variant="secondary"
                disabled={dashboard.isPending}
                onClick={() =>
                  dashboard.mutate(
                    { method: "POST", path: "payments/stripe/dashboard" },
                    {
                      onSuccess: (result) => {
                        const url = result.ok ? urlOf(result.data) : undefined;
                        if (url) window.open(url, "_blank", "noopener");
                      },
                    },
                  )
                }
              >
                <ExternalLink size={16} aria-hidden="true" />
                {text.dashboard}
              </Button>
            )}
          </div>
          {[onboarding.data, refresh.data, dashboard.data].map(
            (result, i) =>
              result &&
              !result.ok && (
                // biome-ignore lint/suspicious/noArrayIndexKey: three fixed actions.
                <FormAlert key={i}>
                  {t.common.failed}: {result.message}
                </FormAlert>
              ),
          )}
          {data.feeDebtMinor > 0 && (
            <p
              role="status"
              className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm"
            >
              {text.feeDebt.replace(
                "{amount}",
                formatMoney(data.feeDebtMinor, data.feeDebtCurrency, locale),
              )}
            </p>
          )}
          {data.currency !== "MXN" && (
            <p
              role="note"
              className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm"
            >
              {text.foreignCurrency.replace("{currency}", data.currency)}
            </p>
          )}
          <p className="text-xs text-fg-muted">{text.payouts}</p>
          {data.status === "active" && (
            <DepositForm
              deposit={data.deposit}
              currency={data.currency}
              locale={locale}
              t={t}
            />
          )}
        </>
      )}
    </Panel>
  );
}
