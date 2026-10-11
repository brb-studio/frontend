"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useTransition } from "react";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { platformSubscription, type WriteResult } from "./actions";
import {
  platformQuery,
  SUBSCRIPTION_STATUSES,
  type SubscriptionRow,
  subscriptionRow,
} from "./model";
import {
  Async,
  card,
  field,
  outlineButton,
  type PlatformText,
  solidButton,
} from "./ui";

const rows = (status: string) =>
  platformQuery(`subscriptions?status=${status}`, subscriptionRow.array());

function Row({
  row,
  locale,
  t,
}: {
  row: SubscriptionRow;
  locale: Locale;
  t: PlatformText["subscriptions"];
}) {
  const queryClient = useQueryClient();
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<WriteResult>();
  const [pending, start] = useTransition();
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(row.expiresAt));

  function run(input: Parameters<typeof platformSubscription>[0]) {
    start(async () => {
      const done = await platformSubscription(input);
      setResult(done);
      if (done.ok)
        await queryClient.invalidateQueries({ queryKey: ["platform"] });
    });
  }

  return (
    <li className={`${card} grid gap-3 p-4 text-sm`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium">
          {row.tenantName ?? "—"}{" "}
          <span className="text-fg-muted">({row.tenantSlug ?? "—"})</span>
        </p>
        <p className="font-medium tabular-nums">
          {formatMoney(row.amountMinor, row.currency, locale)}
          {row.amountMinor !== row.listPriceMinor && (
            <span className="ml-2 text-xs text-fg-muted line-through">
              {formatMoney(row.listPriceMinor, row.currency, locale)}
            </span>
          )}
        </p>
      </div>
      <p className="text-fg-muted">
        {t.status[row.status]} · {t.expires}: {date}
        {row.referralCode && ` · ${t.referral}: ${row.referralCode}`}
        {row.reference && ` · ${row.reference}`}
        {row.rejectionReason && ` · ${row.rejectionReason}`}
      </p>
      {row.status === "pending" && (
        <div className="grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs text-fg-muted">{t.reference}</span>
              <input
                className={field}
                value={reference}
                maxLength={120}
                onChange={(event) => setReference(event.target.value)}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-fg-muted">{t.reason}</span>
              <input
                className={field}
                value={reason}
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={solidButton}
              disabled={pending}
              onClick={() =>
                run({
                  action: "confirm",
                  id: row.id,

                  receivedMinor: row.amountMinor,
                  ...(reference.trim() && { reference: reference.trim() }),
                })
              }
            >
              {t.confirm}
            </button>
            <button
              type="button"
              className={outlineButton}
              disabled={pending}
              onClick={() =>
                run({
                  action: "reject",
                  id: row.id,
                  ...(reason.trim() && { reason: reason.trim() }),
                })
              }
            >
              {t.reject}
            </button>
          </div>
          {result && !result.ok && (
            <p role="alert" className="text-sm text-danger">
              {result.message}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export function Subscriptions({
  locale,
  t,
}: {
  locale: Locale;
  t: PlatformText;
}) {
  const [status, setStatus] =
    useState<(typeof SUBSCRIPTION_STATUSES)[number]>("pending");
  const query = useQuery(rows(status));
  const s = t.subscriptions;
  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h2 className="text-lg font-medium">{s.title}</h2>
        <p className="text-sm text-fg-muted">{s.lead}</p>
      </div>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">{s.title}</legend>
        {SUBSCRIPTION_STATUSES.map((value) => (
          <label
            key={value}
            className="relative cursor-pointer rounded-full border border-line bg-card px-4 py-2.5 text-sm transition-colors hover:border-accent has-checked:border-accent has-checked:bg-accent has-checked:text-accent-fg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
          >
            <input
              type="radio"
              name="subscription-status"
              className="sr-only"
              checked={status === value}
              onChange={() => setStatus(value)}
            />
            {s.status[value]}
          </label>
        ))}
      </fieldset>
      <Async query={query} t={t.states} isEmpty={(data) => data.length === 0}>
        {(data) => (
          <ul className="grid gap-3">
            {data.map((row) => (
              <Row key={row.id} row={row} locale={locale} t={s} />
            ))}
          </ul>
        )}
      </Async>
    </div>
  );
}
