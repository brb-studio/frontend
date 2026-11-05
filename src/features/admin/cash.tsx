"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Banknote,
  CreditCard,
  type LucideIcon,
  Package,
  Scissors,
} from "lucide-react";
import { useState } from "react";
import * as z from "zod";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { Select } from "@/shared/ui/select";
import { today } from "./agenda-manager";
import { adminQuery } from "./api";
import { byCollected, shareOf, totalOf } from "./cash-model";
import {
  branchSchema,
  COUNTER_METHODS,
  type CounterMethod,
  cashDaySchema,
} from "./schemas";
import { type AdminText, Panel } from "./ui";

const branchesQuery = adminQuery("branches", z.array(branchSchema));
const KEY = {
  cash: "cashMinor",
  card: "cardMinor",
  transfer: "transferMinor",
} as const;
const METHOD_ICON: Record<CounterMethod, LucideIcon> = {
  cash: Banknote,
  card: CreditCard,
  transfer: ArrowLeftRight,
};

export function CashDesk({
  locale,
  t,
  chooseBranch,
}: {
  locale: Locale;
  t: AdminText;
  chooseBranch: boolean;
}) {
  const text = t.cash;
  const [day, setDay] = useState(today);
  const [branchId, setBranchId] = useState("");
  const branches = useQuery({ ...branchesQuery, enabled: chooseBranch });
  const report = useQuery(
    adminQuery(
      `cash?date=${day}${branchId ? `&branchId=${branchId}` : ""}`,
      cashDaySchema,
    ),
  );
  const data = report.data;
  const money = (minor: number) =>
    data ? formatMoney(minor, data.currency, locale) : "";
  const time = (at: string, timeZone: string) =>
    new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).format(new Date(at));
  const visit = (at: string, timeZone: string) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).format(new Date(at));
  const dayLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00Z`));
  const dayTotal = data ? totalOf(data.totals) : 0;
  const count = data?.movements.length ?? 0;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">{text.day}</span>
          <input
            type="date"
            value={day}
            onChange={(event) => setDay(event.target.value || today())}
            className="h-13 rounded-2xl border border-line-strong bg-surface px-4 text-fg"
          />
        </label>
        {chooseBranch && branches.data && branches.data.length > 1 && (
          <Select
            name="branchId"
            label={text.branch}
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
          >
            <option value="">{text.allBranches}</option>
            {branches.data.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        )}
      </div>
      {report.isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : !data ? (
        <p role="alert" className="text-danger">
          {text.failed}
        </p>
      ) : (
        <>
          <dl className="grid gap-3 md:grid-cols-4">
            <div className="grid gap-1 rounded-3xl border border-accent bg-card p-4">
              <dt className="text-sm text-fg-muted">{text.total}</dt>
              <dd className="text-2xl font-semibold tabular-nums">
                {money(dayTotal)}
              </dd>
            </div>
            {COUNTER_METHODS.map((method) => {
              const Icon = METHOD_ICON[method];
              return (
                <div
                  key={method}
                  className="flex items-center justify-between gap-3 rounded-3xl border border-line bg-card p-4 md:grid md:justify-normal md:gap-1"
                >
                  <dt className="flex items-center gap-1.5 text-sm text-fg-muted">
                    <Icon size={16} aria-hidden="true" />
                    {t.methods[method]}
                  </dt>
                  <dd className="text-xl font-medium tabular-nums">
                    {money(data.totals[KEY[method]])}
                  </dd>
                </div>
              );
            })}
          </dl>
          {data.unrecorded > 0 && (
            <p role="status" className="text-sm text-danger">
              {text.unrecorded.replace("{n}", String(data.unrecorded))}
            </p>
          )}
          {count === 0 ? (
            <p className="flex flex-1 items-center justify-center text-center text-fg-muted">
              {text.none}
            </p>
          ) : (
            <>
              <Panel title={text.people}>
                <div className="@container">
                  <ul className="grid gap-3 @2xl:grid-cols-[minmax(0,14rem)_auto_minmax(0,1fr)_auto]">
                    {byCollected(data.people).map((person) => {
                      const share = shareOf(person.totalMinor, dayTotal);
                      return (
                        <li
                          key={person.id}
                          className="grid gap-2 rounded-2xl border border-line bg-surface p-3 text-sm @2xl:col-span-4 @2xl:grid-cols-subgrid @2xl:items-center @2xl:gap-x-4 @2xl:px-4"
                        >
                          <p className="flex items-baseline justify-between gap-3 @2xl:contents">
                            <span className="min-w-0 truncate font-medium">
                              {person.name}
                            </span>
                            <span className="shrink-0 text-base font-semibold tabular-nums">
                              {money(person.totalMinor)}
                            </span>
                          </p>
                          <div
                            className="h-1.5 overflow-hidden rounded-full bg-line"
                            role="img"
                            aria-label={text.share.replace(
                              "{n}",
                              String(share),
                            )}
                          >
                            <div
                              className="h-full rounded-full bg-accent"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-fg-muted @2xl:flex-nowrap @2xl:justify-end">
                            {COUNTER_METHODS.filter(
                              (method) => person[KEY[method]] > 0,
                            ).map((method) => {
                              const Icon = METHOD_ICON[method];
                              return (
                                <li
                                  key={method}
                                  className="flex items-center gap-1 tabular-nums"
                                >
                                  <Icon size={14} aria-hidden="true" />
                                  <span className="sr-only">
                                    {t.methods[method]}
                                  </span>
                                  {money(person[KEY[method]])}
                                </li>
                              );
                            })}
                            <li className="ml-auto text-right text-xs leading-tight @2xl:ml-2">
                              <span className="block font-medium whitespace-nowrap text-fg tabular-nums">
                                {text.sharePct.replace("{n}", String(share))}
                              </span>
                              <span className="block whitespace-nowrap">
                                {text.shareOfDay}
                              </span>
                            </li>
                          </ul>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </Panel>
              <Panel
                title={`${text.movementsOn.replace("{day}", dayLabel)} · ${count === 1 ? text.countOne : text.count.replace("{n}", String(count))}`}
              >
                <p className="-mt-2 text-sm text-fg-muted">{text.dayHint}</p>
                <ul className="@container grid gap-2 text-sm">
                  {data.movements.map((m) => {
                    const Kind = m.kind === "cut" ? Scissors : Package;
                    const Method = METHOD_ICON[m.method];
                    return (
                      <li
                        key={`${m.at}:${m.customer}:${m.amountMinor}`}
                        className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5 @2xl:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] @2xl:gap-4 @2xl:px-4"
                      >
                        <time
                          dateTime={m.at}
                          className="rounded-lg bg-accent/15 px-2 py-1 text-xs font-semibold text-accent-text tabular-nums"
                        >
                          {time(m.at, m.timeZone)}
                        </time>
                        <div className="grid min-w-0 gap-0.5 @2xl:contents">
                          <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                            <span className="truncate font-medium">
                              {m.customer}
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-1.5 py-0.5 text-xs text-fg-muted">
                              <Kind size={12} aria-hidden="true" />
                              {m.source === "transfer"
                                ? text.transfer
                                : m.kind === "cut"
                                  ? text.cut
                                  : text.product}
                            </span>
                          </p>
                          <div className="grid min-w-0 gap-0.5 text-fg-muted">
                            <p className="flex min-w-0 items-start gap-1.5">
                              <Method
                                size={14}
                                aria-hidden="true"
                                className="mt-0.5 shrink-0"
                              />
                              <span className="min-w-0">
                                {t.methods[m.method]} ·{" "}
                                {m.source === "transfer"
                                  ? text.acceptedBy.replace(
                                      "{name}",
                                      m.receivedBy,
                                    )
                                  : m.receivedBy}
                              </span>
                            </p>
                            {m.source === "transfer" && (
                              <p className="text-xs">
                                {[
                                  m.reference &&
                                    text.reference.replace(
                                      "{ref}",
                                      m.reference,
                                    ),
                                  m.visitAt &&
                                    text.visit.replace(
                                      "{day}",
                                      visit(m.visitAt, m.timeZone),
                                    ),
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="font-semibold tabular-nums">
                          {money(m.amountMinor)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            </>
          )}
        </>
      )}
    </div>
  );
}
