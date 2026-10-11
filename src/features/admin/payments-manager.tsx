"use client";

import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { adminQuery, useAdminAction } from "./api";
import {
  type AdminPayment,
  bankSettingsSchema,
  PAYMENT_STATUSES,
  paymentSchema,
} from "./schemas";
import {
  type AdminText,
  Panel,
  pill,
  Result,
  Row,
  smallButton,
  Toggle,
  value,
} from "./ui";

const settingsQuery = adminQuery("payments/settings", bankSettingsSchema);
const listQuery = (status: string) =>
  adminQuery(`payments?status=${status}`, paymentSchema.array());

function BankSettings({ t }: { t: AdminText }) {
  const settings = useQuery(settingsQuery);
  const action = useAdminAction();
  const [enabled, setEnabled] = useState<boolean | undefined>();
  if (!settings.data) return null;
  const on = enabled ?? settings.data.bankTransferEnabled;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const clabe = value(form, "bankAccountKey");
    const holder = value(form, "bankAccountHolder");
    action.mutate({
      method: "PATCH",
      path: "payments/settings",
      body: {
        bankTransferEnabled: on,
        ...(clabe ? { bankAccountKey: clabe } : {}),
        ...(holder ? { bankAccountHolder: holder } : {}),
      },
    });
  }

  return (
    <Panel title={t.payments.bank.title}>
      <p className="text-sm text-fg-muted">{t.payments.bank.lead}</p>
      <form onSubmit={submit} className="grid gap-3">
        <Toggle
          label={t.payments.bank.enabled}
          checked={on}
          onChange={setEnabled}
        />
        <Field
          name="bankAccountHolder"
          label={t.payments.bank.holder}
          maxLength={120}
          defaultValue={settings.data.bankAccountHolder ?? ""}
        />
        <Field
          name="bankAccountKey"
          label={t.payments.bank.clabe}
          inputMode="numeric"
          pattern="\d{18}"
          maxLength={18}
          autoComplete="off"
          defaultValue={settings.data.bankAccountKey ?? ""}
        />
        <p className="text-xs text-fg-muted">{t.payments.bank.clabeHint}</p>
        <Result result={action.data} t={t.common} />
        <Button type="submit" disabled={action.isPending}>
          {t.common.save}
        </Button>
      </form>
    </Panel>
  );
}

function PaymentRow({
  payment,
  locale,
  t,
}: {
  payment: AdminPayment;
  locale: Locale;
  t: AdminText;
}) {
  const action = useAdminAction();
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const date = (iso: string) =>
    new Date(iso).toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <Row
      title={`${payment.customerName ?? "—"} · ${formatMoney(payment.amountMinor, payment.currency, locale)}`}
      meta={[
        payment.startAt && `${t.payments.visit}: ${date(payment.startAt)}`,
        payment.customerPhone,
        `${t.payments.status[payment.status]}${payment.status === "pending" ? ` · ${t.payments.expires} ${date(payment.expiresAt)}` : ""}`,
        payment.reference && `${t.payments.reference}: ${payment.reference}`,
        payment.rejectionReason,
      ]
        .filter(Boolean)
        .join(" · ")}
    >
      {payment.status === "pending" && (
        <div className="grid w-full gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field
              name="reference"
              label={t.payments.reference}
              value={reference}
              maxLength={120}
              onChange={(event) => setReference(event.target.value)}
            />
            <Field
              name="reason"
              label={t.payments.reason}
              value={reason}
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={smallButton}
              disabled={action.isPending}
              onClick={() =>
                action.mutate({
                  method: "POST",
                  path: `payments/${payment.id}/confirm`,
                  body: {
                    // The amount the bank statement shows must match; the API refuses anything else.
                    receivedMinor: payment.amountMinor,
                    ...(reference.trim()
                      ? { reference: reference.trim() }
                      : {}),
                  },
                })
              }
            >
              {t.payments.confirm}
            </button>
            <button
              type="button"
              className={smallButton}
              disabled={action.isPending}
              onClick={() =>
                action.mutate({
                  method: "POST",
                  path: `payments/${payment.id}/reject`,
                  body: reason.trim() ? { reason: reason.trim() } : {},
                })
              }
            >
              {t.payments.reject}
            </button>
          </div>
          <Result result={action.data} t={t.common} />
        </div>
      )}
    </Row>
  );
}

function Queue({ locale, t }: { locale: Locale; t: AdminText }) {
  const [status, setStatus] =
    useState<(typeof PAYMENT_STATUSES)[number]>("pending");
  const payments = useQuery(listQuery(status));
  return (
    <Panel title={t.payments.queue}>
      <p className="text-sm text-fg-muted">{t.payments.confirmLead}</p>
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
          </label>
        ))}
      </fieldset>
      {payments.data?.length === 0 && (
        <p className="text-sm text-fg-muted">{t.payments.empty}</p>
      )}
      <ul className="grid gap-2">
        {payments.data?.map((payment) => (
          <PaymentRow
            key={payment.id}
            payment={payment}
            locale={locale}
            t={t}
          />
        ))}
      </ul>
    </Panel>
  );
}

/** Bank account for transfers and the payments waiting for the barbershop to check its bank. Owner and admin only. */
export function PaymentsManager({
  locale,
  t,
}: {
  locale: Locale;
  t: AdminText;
}) {
  return (
    <div className="grid gap-6">
      <BankSettings t={t} />
      <Queue locale={locale} t={t} />
    </div>
  );
}
