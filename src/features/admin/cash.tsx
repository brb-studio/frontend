"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Banknote,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  type LucideIcon,
  Plus,
} from "lucide-react";
import { useState } from "react";
import * as z from "zod";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { Select } from "@/shared/ui/select";
import { today } from "./agenda-manager";
import { adminQuery, useAdminAction } from "./api";
import { EntryActions, EntryForm } from "./cash-actions";
import { shiftDay, signed, type Tone, toneOf } from "./cash-model";
import {
  branchSchema,
  type CashDay,
  COUNTER_METHODS,
  type CounterMethod,
  cashDaySchema,
} from "./schemas";
import { type AdminText, Panel, smallButton } from "./ui";

const branchesQuery = adminQuery("branches", z.array(branchSchema));
const METHOD_ICON: Record<CounterMethod, LucideIcon> = {
  cash: Banknote,
  card: CreditCard,
  transfer: ArrowLeftRight,
};
const TONE_TEXT: Record<Tone, string> = {
  in: "text-money-in",
  out: "text-money-out",
  adjust: "text-money-adjust",
};
const TONE_DOT: Record<Tone, string> = {
  in: "bg-money-in",
  out: "bg-money-out",
  adjust: "bg-money-adjust",
};

type Entry = CashDay["entries"][number];

export function CashDesk({
  locale,
  t,
  chooseBranch,
  canWrite,
}: {
  locale: Locale;
  t: AdminText;
  chooseBranch: boolean;
  canWrite: boolean;
}) {
  const text = t.cash;
  const [day, setDay] = useState(today);
  const [branchId, setBranchId] = useState("");
  const branches = useQuery({
    ...branchesQuery,
    enabled: chooseBranch || canWrite,
  });
  const action = useAdminAction();
  const [adding, setAdding] = useState<"expense" | "adjustment" | null>(null);
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

  const who = (e: Entry) => {
    if (!e.recordedBy) return e.channel === "online" ? text.byStripe : "";
    if (e.channel === "spei" && e.direction === "in") {
      return text.acceptedBy.replace("{name}", e.recordedBy);
    }
    const sale = e.type === "service_payment" || e.type === "product_sale";
    return (sale ? text.receivedBy : text.paidBy).replace(
      "{name}",
      e.recordedBy,
    );
  };
  const how = (e: Entry) =>
    e.channel === "spei"
      ? text.channels.spei
      : [e.method && t.methods[e.method], e.channel && text.channels[e.channel]]
          .filter(Boolean)
          .join(" · ");

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDay(shiftDay(day, -1))}
            aria-label={text.previousDay}
            className="grid size-11 place-items-center rounded-full border border-line-strong"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <label className="relative">
            <span className="sr-only">{text.day}</span>
            <input
              type="date"
              value={day}
              onChange={(event) => setDay(event.target.value || today())}
              className="h-11 rounded-full border border-line-strong bg-surface px-4 text-fg"
            />
          </label>
          <button
            type="button"
            onClick={() => setDay(shiftDay(day, 1))}
            aria-label={text.nextDay}
            className="grid size-11 place-items-center rounded-full border border-line-strong"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setDay(today())}
            disabled={day === today()}
            className="h-11 rounded-full border border-line-strong px-4 text-sm font-medium disabled:opacity-50"
          >
            {text.today}
          </button>
        </div>
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
      <p className="-mt-3 text-sm text-fg-muted first-letter:uppercase">
        {dayLabel}
      </p>
      {report.isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : !data ? (
        <p role="alert" className="text-danger">
          {text.failed}
        </p>
      ) : (
        <>
          <dl className="grid gap-2 sm:grid-cols-3 sm:gap-3">
            {[
              { label: text.in, minor: data.inMinor, tone: "text-money-in" },
              { label: text.out, minor: data.outMinor, tone: "text-money-out" },
              { label: text.net, minor: data.netMinor, tone: "" },
            ].map(({ label, minor, tone }, i) => (
              <div
                key={label}
                className={`flex items-center justify-between gap-3 rounded-3xl border bg-card px-4 py-3 sm:grid sm:justify-normal sm:gap-1 sm:py-4 ${i === 2 ? "border-line-strong" : "border-line"}`}
              >
                <dt className="text-sm text-fg-muted">{label}</dt>
                <dd
                  className={`text-xl font-semibold tabular-nums sm:text-2xl ${minor === 0 ? "text-fg-muted" : tone}`}
                >
                  {money(minor)}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {COUNTER_METHODS.map((method) => {
                const Icon = METHOD_ICON[method];
                return (
                  <li
                    key={method}
                    className="flex items-center gap-1.5 text-fg-muted"
                  >
                    <Icon size={15} aria-hidden="true" />
                    {t.methods[method]}
                    <span className="font-medium text-fg tabular-nums">
                      {money(data.byMethod[method]?.netMinor ?? 0)}
                    </span>
                  </li>
                );
              })}
            </ul>
            {data.pending.count > 0 && (
              <p
                role="status"
                className="rounded-full border border-line px-3 py-1 text-fg-muted"
              >
                {(data.pending.count === 1 ? text.pendingOne : text.pending)
                  .replace("{n}", String(data.pending.count))
                  .replace("{amount}", money(data.pending.amountMinor))}
              </p>
            )}
          </div>
          {canWrite &&
            (adding ? (
              <EntryForm
                key={adding}
                kind={adding}
                branches={branches.data ?? []}
                currency={data.currency}
                t={t}
                action={action}
                onClose={() => setAdding(null)}
                onSaved={() => {
                  setAdding(null);
                  setDay(today());
                }}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={smallButton}
                  onClick={() => {
                    action.reset();
                    setAdding("expense");
                  }}
                >
                  <Plus size={16} aria-hidden="true" />
                  {text.addExpense}
                </button>
                <button
                  type="button"
                  className={smallButton}
                  onClick={() => {
                    action.reset();
                    setAdding("adjustment");
                  }}
                >
                  <Plus size={16} aria-hidden="true" />
                  {text.addAdjustment}
                </button>
              </div>
            ))}
          {data.entries.length === 0 ? (
            <p className="flex flex-1 items-center justify-center text-center text-fg-muted">
              {text.none}
            </p>
          ) : (
            <Panel
              title={`${text.timeline} · ${data.entries.length === 1 ? text.countOne : text.count.replace("{n}", String(data.entries.length))}`}
            >
              <ul className="grid gap-2 text-sm">
                {data.entries.map((e) => {
                  const tone = toneOf(e);
                  return (
                    <li key={e.id}>
                      <details className="group rounded-2xl border border-line bg-surface">
                        <summary className="grid cursor-pointer list-none grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-2.5 sm:px-4 [&::-webkit-details-marker]:hidden">
                          <time
                            dateTime={e.at}
                            className="flex items-center gap-2 text-xs font-semibold tabular-nums text-fg-muted"
                          >
                            <span
                              className={`size-2 rounded-full ${TONE_DOT[tone]}`}
                              aria-hidden="true"
                            />
                            {time(e.at, e.timeZone)}
                          </time>
                          <span className="grid min-w-0 gap-0.5">
                            <span className="truncate font-medium">
                              {e.concept || text.types[e.type]}
                            </span>
                            <span className="truncate text-fg-muted">
                              {[
                                text.types[e.type],
                                e.customer,
                                e.method && t.methods[e.method],
                                who(e),
                                e.reverses && text.reversalTag,
                                e.reversed && text.reversedTag,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </span>
                          <span
                            className={`font-semibold tabular-nums ${TONE_TEXT[tone]}`}
                          >
                            {signed(e.direction, money(e.amountMinor))}
                          </span>
                          <ChevronRight
                            size={16}
                            aria-hidden="true"
                            className="text-fg-muted transition-transform group-open:rotate-90"
                          />
                        </summary>
                        <dl className="grid gap-x-4 gap-y-1.5 border-t border-line px-3 py-3 sm:grid-cols-[auto_1fr] sm:px-4">
                          <dt className="text-fg-muted">{text.what}</dt>
                          <dd>{text.types[e.type]}</dd>
                          {how(e) && (
                            <>
                              <dt className="text-fg-muted">{text.how}</dt>
                              <dd>{how(e)}</dd>
                            </>
                          )}
                          {e.customer && (
                            <>
                              <dt className="text-fg-muted">{text.customer}</dt>
                              <dd>{e.customer}</dd>
                            </>
                          )}
                          {(e.recordedBy || e.channel === "online") && (
                            <>
                              <dt className="text-fg-muted">{text.who}</dt>
                              <dd>{e.recordedBy ?? "Stripe"}</dd>
                            </>
                          )}
                          {e.reference && (
                            <>
                              <dt className="text-fg-muted">
                                {text.reference}
                              </dt>
                              <dd className="font-mono">{e.reference}</dd>
                            </>
                          )}
                          {e.visitAt && (
                            <>
                              <dt className="text-fg-muted">{text.visit}</dt>
                              <dd>{visit(e.visitAt, e.timeZone)}</dd>
                            </>
                          )}
                          {e.note && (
                            <>
                              <dt className="text-fg-muted">{text.note}</dt>
                              <dd>{e.note}</dd>
                            </>
                          )}
                          {e.approximate && (
                            <dd className="text-fg-muted sm:col-span-2">
                              {text.approximate}
                            </dd>
                          )}
                        </dl>
                        {canWrite && (
                          <div className="border-t border-line px-3 py-3 sm:px-4">
                            <EntryActions
                              entry={e}
                              locale={locale}
                              currency={data.currency}
                              t={t}
                              action={action}
                            />
                          </div>
                        )}
                      </details>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
