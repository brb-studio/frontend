"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import * as z from "zod";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { today } from "./agenda-manager";
import { adminQuery } from "./api";
import { PERIODS, type Period, rangeOf } from "./periods";
import { type AdminText, pill } from "./ui";

const summarySchema = z.object({
  currency: z.string(),
  cuts: z.number(),
  servicesMinor: z.number(),
  productsMinor: z.number(),
  commissionMinor: z.number(),
  collected: z.object({
    onlineMinor: z.number(),
    cashMinor: z.number(),
    cardMinor: z.number(),
    transferMinor: z.number(),
    unrecordedMinor: z.number(),
  }),
  days: z.array(z.object({ date: z.string(), totalMinor: z.number() })),
});
type Day = z.output<typeof summarySchema>["days"][number];

function Bars({
  days,
  money,
  label,
  locale,
}: {
  days: Day[];
  money: (minor: number) => string;
  label: (date: string) => string;
  locale: Locale;
}) {
  const [active, setActive] = useState(days.length - 1);
  const max = Math.max(1, ...days.map((d) => d.totalMinor));
  const shown = days[active] ?? days[days.length - 1];
  const tick = (date: string) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: "UTC",
      ...(days.length <= 7 ? { weekday: "short" } : { day: "numeric" }),
    }).format(new Date(`${date}T00:00:00Z`));

  return (
    <div className="grid gap-3">
      <p aria-live="polite" className="flex justify-between gap-3 text-sm">
        <span className="capitalize text-fg-muted">
          {shown && label(shown.date)}
        </span>
        <strong className="tabular-nums">
          {shown && money(shown.totalMinor)}
        </strong>
      </p>
      <div className="flex h-40 items-end gap-0.5 border-b border-line">
        {days.map((d, i) => (
          <button
            key={d.date}
            type="button"
            aria-label={`${label(d.date)}: ${money(d.totalMinor)}`}
            aria-pressed={i === active}
            onPointerEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            className="flex h-full min-w-0 flex-1 cursor-pointer items-end focus-visible:outline-2 focus-visible:outline-accent"
          >
            <span
              className={`mx-auto w-full max-w-12 rounded-t-[4px] bg-accent transition-opacity ${i === active ? "" : "opacity-50"}`}
              style={{ height: `${(d.totalMinor / max) * 100}%` }}
            />
          </button>
        ))}
      </div>
      <div aria-hidden className="flex gap-0.5 text-xs text-fg-muted">
        {days.map((d, i) => (
          <span key={d.date} className="min-w-0 flex-1 text-center">
            {(days.length <= 7 || i % 7 === 0) && tick(d.date)}
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
  const [period, setPeriod] = useState<Period>("today");
  const { from, to } = rangeOf(period, today());
  const query = useQuery(
    adminQuery(`earnings/summary?from=${from}&to=${to}`, summarySchema),
  );
  const data = query.data;
  const money = (minor: number) =>
    data ? formatMoney(minor, data.currency, locale) : "…";
  const label = (date: string) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: "UTC",
      weekday: "long",
      day: "numeric",
      month: "short",
    }).format(new Date(`${date}T00:00:00Z`));

  const total = data ? data.servicesMinor + data.productsMinor : 0;
  const how = data
    ? (
        [
          [t.methods.cash, data.collected.cashMinor],
          [t.methods.card, data.collected.cardMinor],
          [t.methods.transfer, data.collected.transferMinor],
          [text.online, data.collected.onlineMinor],
          [text.unrecorded, data.collected.unrecordedMinor],
        ] as const
      )
        .filter(([, minor]) => minor > 0)
        .map(([name, minor]) => `${name} ${money(minor)}`)
        .join(" · ")
    : "";
  const cards = [
    {
      label: text.total,
      value: money(total),
      detail:
        productsEnabled && data
          ? `${text.services} ${money(data.servicesMinor)} · ${text.products} ${money(data.productsMinor)}`
          : undefined,
      how,
    },
    // Only worth a card when there are barber commissions to take away.
    ...(data?.commissionMinor
      ? [
          {
            label: text.net,
            value: money(total - data.commissionMinor),
            detail: `${text.commission} −${money(data.commissionMinor)}`,
          },
        ]
      : []),
    {
      label: text.cuts,
      value: data ? String(data.cuts) : "…",
      detail: data?.cuts
        ? `${text.average} ${money(Math.round(data.servicesMinor / data.cuts))}`
        : undefined,
    },
  ];

  return (
    <div className="grid gap-6">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">{text.period}</legend>
        {PERIODS.map((p) => (
          <label key={p} className={pill}>
            <input
              type="radio"
              name="period"
              className="sr-only"
              checked={period === p}
              onChange={() => setPeriod(p)}
            />
            {text.periods[p]}
          </label>
        ))}
      </fieldset>
      {query.isError ? (
        <p role="alert" className="text-sm text-danger">
          {text.failed}
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.label}
                className="grid content-start gap-1 rounded-3xl border border-line bg-card p-4 first:col-span-2 even:last:col-span-2 sm:col-span-1!"
              >
                <dt className="text-sm text-fg-muted">{card.label}</dt>
                <dd className="text-2xl font-medium tabular-nums">
                  {card.value}
                </dd>
                {card.detail && (
                  <dd className="text-sm text-fg-muted">{card.detail}</dd>
                )}
                {"how" in card && card.how && (
                  <dd className="text-sm text-fg-muted">{card.how}</dd>
                )}
              </div>
            ))}
          </dl>
          {data && data.days.length > 1 && total > 0 && (
            <section className="grid gap-3 rounded-[1.75rem] border border-line bg-card p-5">
              <h2 className="text-lg font-medium">{text.byDay}</h2>
              <Bars
                key={`${from}:${to}`}
                days={data.days}
                money={money}
                label={label}
                locale={locale}
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
