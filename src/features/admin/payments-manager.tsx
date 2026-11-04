"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CircleCheck,
  Clock,
  CreditCard,
  Inbox,
  Landmark,
  Phone,
  X,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Notice } from "./admin-kit";
import { adminQuery, useAdminAction } from "./api";
import { masked, minutesLeft } from "./money-view";
import { OnlinePayments } from "./online-payments";
import {
  type AdminPayment,
  bankSettingsSchema,
  connectSchema,
  PAYMENT_STATUSES,
  paymentSchema,
} from "./schemas";
import { type AdminText, Panel, pill, Result, Toggle, value } from "./ui";

const settingsQuery = adminQuery("payments/settings", bankSettingsSchema);
const connectQuery = adminQuery("payments/stripe", connectSchema);
const listQuery = (status: string) =>
  adminQuery(`payments?status=${status}`, paymentSchema.array());

function BankSettings({ t }: { t: AdminText }) {
  const settings = useQuery(settingsQuery);
  const action = useAdminAction();
  const [enabled, setEnabled] = useState<boolean | undefined>();
  const [clabe, setClabe] = useState<string | undefined>();
  if (!settings.data) return null;
  const on = enabled ?? settings.data.bankTransferEnabled;
  const key = clabe ?? settings.data.bankAccountKey ?? "";
  const saved = settings.data.bankAccountKey;
  const text = t.payments;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const holder = value(form, "bankAccountHolder");
    action.mutate({
      method: "PATCH",
      path: "payments/settings",
      body: {
        bankTransferEnabled: on,
        ...(key ? { bankAccountKey: key } : {}),
        ...(holder ? { bankAccountHolder: holder } : {}),
      },
    });
  }

  return (
    <Panel
      title={text.bank.title}
      action={
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ${on && saved ? "bg-accent text-accent-fg" : "border border-line text-fg-muted"}`}
        >
          <Landmark size={14} aria-hidden="true" />
          {on ? (saved ? text.bankOn : text.bankMissing) : text.bankOff}
        </span>
      }
    >
      <p className="-mt-2 text-sm text-fg-muted">{text.bank.lead}</p>
      {saved && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
          <Landmark size={16} aria-hidden="true" className="text-fg-muted" />
          <span className="font-mono tracking-wider">{masked(saved)}</span>
          {settings.data.bankAccountHolder && (
            <span className="text-fg-muted">
              · {settings.data.bankAccountHolder}
            </span>
          )}
        </p>
      )}
      <form onSubmit={submit} className="grid gap-3">
        <Toggle label={text.bank.enabled} checked={on} onChange={setEnabled} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            name="bankAccountHolder"
            label={text.bank.holder}
            maxLength={120}
            defaultValue={settings.data.bankAccountHolder ?? ""}
          />
          <Field
            name="bankAccountKey"
            label={text.bank.clabe}
            hint={text.digits.replace("{n}", String(key.length))}
            inputMode="numeric"
            pattern="\d{18}"
            maxLength={18}
            autoComplete="off"
            value={key}
            onChange={(event) =>
              setClabe(event.target.value.replace(/\D/g, ""))
            }
            className="[&_input]:font-mono [&_input]:tracking-wider"
          />
        </div>
        <p className="text-xs text-fg-muted">{text.bank.clabeHint}</p>
        {action.data && <Result result={action.data} t={t.common} />}
        <Button type="submit" disabled={action.isPending} className="sm:w-fit">
          {t.common.save}
        </Button>
      </form>
    </Panel>
  );
}

function PaymentCard({
  payment,
  locale,
  t,
  onDone,
}: {
  payment: AdminPayment;
  locale: Locale;
  t: AdminText;
  /** What was saved, in words. */
  onDone: (message: string) => void;
}) {
  const action = useAdminAction();
  const [asking, setAsking] = useState<"confirm" | "reject" | null>(null);
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const text = t.payments;
  const amount = formatMoney(payment.amountMinor, payment.currency, locale);
  const who = payment.customerName ?? "—";
  const date = (iso: string) =>
    new Date(iso).toLocaleString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  const left = minutesLeft(payment.expiresAt);
  const pending = payment.status === "pending";
  const leftText =
    left <= 0
      ? text.expired
      : text.expiresIn.replace(
          "{time}",
          left < 60
            ? `${left} min`
            : `${Math.floor(left / 60)} h ${left % 60} min`,
        );

  const send = (kind: "confirm" | "reject") =>
    action.mutate(
      kind === "confirm"
        ? {
            method: "POST",
            path: `payments/${payment.id}/confirm`,
            body: {
              // The amount the bank statement shows must match; the API refuses anything else.
              receivedMinor: payment.amountMinor,
              ...(reference.trim() ? { reference: reference.trim() } : {}),
            },
          }
        : {
            method: "POST",
            path: `payments/${payment.id}/reject`,
            body: reason.trim() ? { reason: reason.trim() } : {},
          },
      {
        onSuccess: (result) => {
          setAsking(null);
          if (result.ok)
            onDone(
              (kind === "confirm" ? text.confirmed : text.rejected)
                .replace("{who}", who)
                .replace("{amount}", amount),
            );
        },
      },
    );

  return (
    <li
      className={`grid gap-3 rounded-3xl border bg-card p-4 text-sm ${pending ? "border-accent" : "border-line"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-base font-medium">{who}</p>
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-fg-muted">
            {payment.customerPhone && (
              <a
                href={`tel:${payment.customerPhone}`}
                className="inline-flex items-center gap-1 underline-offset-4 hover:text-fg hover:underline"
              >
                <Phone size={14} aria-hidden="true" />
                {payment.customerPhone}
              </a>
            )}
            {payment.startAt && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={14} aria-hidden="true" />
                {text.visit}: {date(payment.startAt)}
              </span>
            )}
          </p>
        </div>
        <div className="grid justify-items-end gap-1">
          <span className="text-2xl font-semibold tabular-nums">{amount}</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${pending ? (left <= 0 ? "border border-danger/50 text-danger" : "bg-accent text-accent-fg") : "border border-line text-fg-muted"}`}
          >
            <Clock size={12} aria-hidden="true" />
            {pending ? leftText : text.status[payment.status]}
          </span>
        </div>
      </div>
      {(payment.reference || payment.rejectionReason) && (
        <p className="text-fg-muted">
          {payment.reference &&
            `${text.reference.split(" (")[0]}: ${payment.reference}`}
          {payment.rejectionReason && ` · ${payment.rejectionReason}`}
        </p>
      )}
      {pending &&
        (asking ? (
          <div
            role="alertdialog"
            className={`grid gap-3 rounded-2xl border p-4 ${asking === "reject" ? "border-danger/60" : "border-accent"}`}
          >
            <div className="grid gap-1">
              <p className="font-medium">
                {asking === "confirm"
                  ? text.confirmAsk.replace("{amount}", amount)
                  : text.rejectAsk}
              </p>
              <p className="text-xs text-fg-muted">
                {asking === "reject"
                  ? `${text.rejectNote} ${text.cannotUndo}`
                  : text.cannotUndo}
              </p>
            </div>
            {asking === "confirm" ? (
              <Field
                name="reference"
                label={text.reference}
                value={reference}
                maxLength={120}
                onChange={(event) => setReference(event.target.value)}
              />
            ) : (
              <Field
                name="reason"
                label={text.reason}
                value={reason}
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                autoFocus
                onClick={() => setAsking(null)}
              >
                {text.back}
              </Button>
              <Button
                variant={asking === "reject" ? "danger" : "primary"}
                disabled={action.isPending}
                onClick={() => send(asking)}
              >
                {asking === "confirm" ? text.yesConfirm : text.yesReject}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={() => setAsking("confirm")}>
              <CircleCheck size={18} aria-hidden="true" />
              {text.confirm}
            </Button>
            <Button variant="danger" onClick={() => setAsking("reject")}>
              <X size={18} aria-hidden="true" />
              {text.reject}
            </Button>
          </div>
        ))}
      {action.data && !action.data.ok && (
        <Result result={action.data} t={t.common} />
      )}
    </li>
  );
}

function Queue({ locale, t }: { locale: Locale; t: AdminText }) {
  const [status, setStatus] =
    useState<(typeof PAYMENT_STATUSES)[number]>("pending");
  const [notice, setNotice] = useState<string | null>(null);
  const payments = useQuery(listQuery(status));
  // Always known, so the "pending" tab can say how many wait.
  const waiting = useQuery(listQuery("pending"));
  const count = waiting.data?.length ?? 0;
  return (
    <Panel title={t.payments.queue}>
      <p className="-mt-2 text-sm text-fg-muted">{t.payments.confirmLead}</p>
      <Notice
        message={notice}
        closeLabel={t.common.close}
        onClose={() => setNotice(null)}
      />
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">{t.payments.queue}</legend>
        {PAYMENT_STATUSES.map((s) => (
          <label key={s} className={pill}>
            <input
              type="radio"
              name="status"
              className="sr-only"
              checked={status === s}
              onChange={() => setStatus(s)}
            />
            {t.payments.status[s]}
            {s === "pending" && count > 0 && (
              <span className="ml-1.5 rounded-full bg-accent px-1.5 text-xs text-accent-fg tabular-nums">
                {count}
              </span>
            )}
          </label>
        ))}
      </fieldset>
      {payments.isPending ? (
        <p className="text-sm text-fg-muted">{t.common.loading}</p>
      ) : payments.data?.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <Inbox size={16} aria-hidden="true" />
          {t.payments.empty}
        </p>
      ) : (
        <ul className="grid gap-3">
          {payments.data?.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              locale={locale}
              t={t}
              onDone={setNotice}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** The page at a glance: card payments, transfers and what waits, each a jump to its section. */
function Overview({ t }: { t: AdminText }) {
  const connect = useQuery(connectQuery);
  const settings = useQuery(settingsQuery);
  const waiting = useQuery(listQuery("pending"));
  const text = t.payments;
  const count = waiting.data?.length ?? 0;
  const cardLive = connect.data?.status === "active";
  const bankLive = Boolean(
    settings.data?.bankTransferEnabled && settings.data.bankAccountKey,
  );
  const items = [
    {
      href: "#cobros-tarjeta",
      icon: CreditCard,
      good: cardLive,
      label: connect.data
        ? text.overviewCard.replace(
            "{status}",
            text.online.status[connect.data.status],
          )
        : "…",
    },
    {
      href: "#cobros-banco",
      icon: Landmark,
      good: bankLive,
      label: settings.data
        ? text.overviewTransfers.replace(
            "{status}",
            settings.data.bankTransferEnabled
              ? settings.data.bankAccountKey
                ? text.bankOn
                : text.bankMissing
              : text.bankOff,
          )
        : "…",
    },
    {
      href: "#cobros-transferencias",
      icon: count > 0 ? Clock : CircleCheck,
      good: count === 0,
      label:
        count === 0
          ? text.overviewClear
          : count === 1
            ? text.overviewWaitingOne
            : text.overviewWaiting.replace("{n}", String(count)),
    },
  ];
  return (
    <nav aria-label={t.nav.payments} className="grid gap-2 sm:grid-cols-3">
      {items.map(({ href, icon: Icon, good, label }) => (
        <a
          key={href}
          href={href}
          className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors hover:border-accent ${good ? "border-line bg-card" : "border-accent bg-card"}`}
        >
          <Icon
            size={18}
            aria-hidden="true"
            className={good ? "text-fg-muted" : "text-accent-text"}
          />
          {label}
        </a>
      ))}
    </nav>
  );
}

/** Card and transfer payments through Stripe, plus the manual fallback: bank account and the transfers to check by hand. Owner and admin only. */
export function PaymentsManager({
  locale,
  stripeReturn,
  t,
}: {
  locale: Locale;
  stripeReturn?: "return" | "refresh";
  t: AdminText;
}) {
  return (
    <div className="grid gap-6">
      <Overview t={t} />
      <div id="cobros-tarjeta" className="scroll-mt-24">
        <OnlinePayments locale={locale} stripeReturn={stripeReturn} t={t} />
      </div>
      <div id="cobros-banco" className="scroll-mt-24">
        <BankSettings t={t} />
      </div>
      <div id="cobros-transferencias" className="scroll-mt-24">
        <Queue locale={locale} t={t} />
      </div>
    </div>
  );
}
