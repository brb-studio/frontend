"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, ExternalLink, RefreshCw } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form";
import { adminQuery, useAdminAction } from "./api";
import { connectSchema } from "./schemas";
import { type AdminText, Panel, Result, smallButton, Toggle } from "./ui";

const connectQuery = adminQuery("payments/stripe", connectSchema);

const urlOf = (data: unknown) =>
  typeof data === "object" &&
  data !== null &&
  "url" in data &&
  typeof data.url === "string" &&
  data.url.startsWith("https://")
    ? data.url
    : undefined;

function DepositForm({
  deposit,
  t,
}: {
  deposit: { enabled: boolean; percentBps: number };
  t: AdminText;
}) {
  const action = useAdminAction();
  const [enabled, setEnabled] = useState(deposit.enabled);
  const text = t.payments.online.deposit;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const percent = Number(new FormData(event.currentTarget).get("percent"));
    action.mutate({
      method: "PATCH",
      path: "payments/deposit",
      body: { enabled, percentBps: Math.round(percent * 100) },
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-3 border-t border-line pt-4">
      <p className="font-medium">{text.title}</p>
      <Toggle label={text.enabled} checked={enabled} onChange={setEnabled} />
      <Field
        name="percent"
        label={text.percent}
        type="number"
        inputMode="decimal"
        min={1}
        max={100}
        step={1}
        required
        defaultValue={String(deposit.percentBps / 100)}
      />
      <p className="text-xs text-fg-muted">{text.hint}</p>
      <Result result={action.data} t={t.common} />
      <Button type="submit" disabled={action.isPending}>
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

  return (
    <Panel title={text.title}>
      <p className="text-sm text-fg-muted">{text.lead}</p>
      {!data.available ? (
        <p className="text-sm">{text.unavailable}</p>
      ) : (
        <>
          <p className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
            <span className="flex items-center gap-2 font-medium">
              <CreditCard
                size={18}
                aria-hidden="true"
                className="text-accent"
              />
              {status}
            </span>
            <button
              type="button"
              className={smallButton}
              disabled={refresh.isPending}
              onClick={checkStatus}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {text.refresh}
            </button>
          </p>
          {stripeReturn === "return" && data.status !== "active" && (
            <p role="status" className="text-sm text-fg-muted">
              {text.returned}
            </p>
          )}
          {data.requirementsDue.length > 0 && data.status !== "none" && (
            <div className="grid gap-1 text-sm">
              <p className="font-medium">{text.requirements}:</p>
              <ul className="list-inside list-disc text-fg-muted">
                {data.requirementsDue.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {data.status !== "active" && (
              <Button onClick={startOnboarding} disabled={onboarding.isPending}>
                {data.status === "none" ? text.activate : text.continue}
              </Button>
            )}
            {data.status !== "none" && data.status !== "onboarding" && (
              <button
                type="button"
                className={smallButton}
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
              </button>
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
            <DepositForm deposit={data.deposit} t={t} />
          )}
        </>
      )}
    </Panel>
  );
}
