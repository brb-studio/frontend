"use client";

import { Check, Copy, Gift, Landmark, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { checkReferralCode, requestPayment } from "./actions";
import type { Billing, BillingError, SubscriptionPayment } from "./model";

type Text = Dictionary["admin"]["billing"];

export function BillingPanel({
  billing,
  lang,
  t,
}: {
  billing: Billing;
  lang: Locale;
  t: Text;
}) {
  const lifetime = billing.plan === "lifetime";
  const money = (minor: number) =>
    formatMoney(minor, billing.price.currency, lang);

  return (
    <div className="grid max-w-xl gap-6">
      <SubscriptionCard billing={billing} lang={lang} money={money} t={t} />

      {!lifetime && billing.pending && (
        <TransferCard
          payment={billing.pending}
          lang={lang}
          money={money}
          t={t}
        />
      )}

      {!lifetime && <ReferralCard billing={billing} money={money} t={t} />}
    </div>
  );
}

function CopyButton({ text, t }: { text: string; t: Text }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      className="h-10"
      onClick={() => {
        void navigator.clipboard
          .writeText(text)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2_000);
          })
          .catch(() => {});
      }}
    >
      {copied ? (
        <Check size={16} aria-hidden />
      ) : (
        <Copy size={16} aria-hidden />
      )}
      {copied ? t.copied : t.copy}
    </Button>
  );
}

function TransferCard({
  payment,
  lang,
  money,
  t,
}: {
  payment: SubscriptionPayment;
  lang: Locale;
  money: (minor: number) => string;
  t: Text;
}) {
  const until = new Intl.DateTimeFormat(lang, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(payment.expiresAt));
  const rows = [
    { label: t.transferHolder, value: payment.holder },
    { label: t.transferClabe, value: payment.clabe, copy: true },
    { label: t.transferAmount, value: money(payment.amountMinor) },
  ];
  return (
    <section className="grid gap-4 rounded-[2rem] border border-line bg-card p-6">
      <h2 className="flex items-center gap-2 text-lg font-medium">
        <Landmark size={20} aria-hidden className="text-accent" />
        {t.transferTitle}
      </h2>
      <p className="text-sm text-fg-muted">{t.transferLead}</p>
      <dl className="grid gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-surface px-4 py-3"
          >
            <div className="grid min-w-0">
              <dt className="text-xs text-fg-muted">{row.label}</dt>
              <dd className="break-all font-medium tabular-nums">
                {row.value}
              </dd>
            </div>
            {row.copy && <CopyButton text={row.value} t={t} />}
          </div>
        ))}
      </dl>
      {(payment.discountMinor > 0 || payment.creditAppliedMinor > 0) && (
        <p className="text-xs text-fg-muted">
          {money(payment.listPriceMinor)}
          {payment.discountMinor > 0 &&
            ` − ${money(payment.discountMinor)} (${t.referralDiscount})`}
          {payment.creditAppliedMinor > 0 &&
            ` − ${money(payment.creditAppliedMinor)} (${t.credit})`}
        </p>
      )}
      <p className="text-xs text-fg-muted">
        {t.transferExpires} {until}
      </p>
      <p role="status" className="text-sm">
        {t.transferPending}
      </p>
    </section>
  );
}

function SubscriptionCard({
  billing,
  lang,
  money,
  t,
}: {
  billing: Billing;
  lang: Locale;
  money: (minor: number) => string;
  t: Text;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{
    code: string;
    discountPercent: number;
  }>();
  const [error, setError] = useState<BillingError>();
  const [pending, startTransition] = useTransition();
  const lifetime = billing.plan === "lifetime";
  const canPay = !lifetime && !billing.pending;
  const firstMonth = !billing.referredBy && billing.referral.code === null;
  const date = (iso?: string) =>
    iso &&
    new Intl.DateTimeFormat(lang, { dateStyle: "long" }).format(new Date(iso));
  const end = date(billing.currentPeriodEnd);

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await checkReferralCode(code);
      setError(result.ok ? undefined : result.error);
      setApplied(result.ok ? result.data : undefined);
    });
  }

  function pay() {
    startTransition(async () => {
      const result = await requestPayment(applied?.code);
      if (result.ok) {
        setError(undefined);
        router.refresh();
      } else setError(result.error);
    });
  }

  const discounted = applied
    ? Math.round(
        (billing.price.amountMinor * (100 - applied.discountPercent)) / 100,
      )
    : undefined;

  return (
    <section className="grid gap-5 rounded-[2rem] border border-line bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-sm text-fg-muted">{t.product}</p>
          {!lifetime && (
            <p className="text-3xl font-medium">
              {money(billing.price.amountMinor)}
              <span className="text-base text-fg-muted">{t.perMonth}</span>
            </p>
          )}
        </div>
        <span className="rounded-full border border-line px-3 py-1 text-sm">
          {billing.subscribed ? t.status.active : t.status[billing.status]}
        </span>
      </div>

      {lifetime && <p className="text-sm text-fg-muted">{t.lifetime}</p>}
      {!lifetime && end && (
        <p className="text-sm text-fg-muted">
          {billing.subscribed ? t.paidUntil : t.endedOn} {end}
        </p>
      )}
      {billing.referredBy && (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <Gift size={16} aria-hidden />
          {t.referredBy} {billing.referredBy.discountPercent}% {t.off}.
        </p>
      )}
      {!lifetime && billing.creditMinor > 0 && (
        <p className="text-sm text-fg-muted">
          {t.credit}: {money(billing.creditMinor)}. {t.creditHint}
        </p>
      )}

      {canPay && firstMonth && (
        <form onSubmit={apply} className="grid gap-2">
          <Field
            name="code"
            label={t.codeLabel}
            hint={t.codeHint}
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setApplied(undefined);
              setError(undefined);
            }}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={20}
            action={
              code.trim() && !applied ? (
                <button
                  type="submit"
                  disabled={pending}
                  className="text-sm font-medium text-accent-text"
                >
                  {t.apply}
                </button>
              ) : undefined
            }
          />
          {applied && discounted !== undefined && (
            <p
              role="status"
              className="flex flex-wrap items-center gap-x-2 text-sm text-accent-text"
            >
              <Check size={16} aria-hidden />
              {t.applied} {applied.discountPercent}% {t.off}.
              <span className="text-fg">
                {t.firstMonth}:{" "}
                <s className="text-fg-muted">
                  {money(billing.price.amountMinor)}
                </s>{" "}
                <strong>{money(discounted)}</strong>
              </span>
              <button
                type="button"
                className="text-fg-muted underline"
                onClick={() => {
                  setApplied(undefined);
                  setCode("");
                }}
              >
                {t.removeCode}
              </button>
            </p>
          )}
        </form>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {t.errors[error]}
        </p>
      )}

      {canPay && (
        <Button
          disabled={pending || Boolean(code.trim() && !applied)}
          onClick={pay}
        >
          {pending ? (
            <LoaderCircle size={18} className="animate-spin" aria-hidden />
          ) : (
            <Landmark size={18} aria-hidden />
          )}
          {billing.subscribed ? t.renew : t.pay}
        </Button>
      )}
    </section>
  );
}

function ReferralCard({
  billing,
  money,
  t,
}: {
  billing: Billing;
  money: (minor: number) => string;
  t: Text;
}) {
  const [copied, setCopied] = useState(false);
  const { referral } = billing;

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2_000);
    } catch {}
  }

  return (
    <section className="grid gap-4 rounded-[2rem] border border-line bg-card p-6">
      <h2 className="flex items-center gap-2 text-lg font-medium">
        <Gift size={20} aria-hidden />
        {t.referralTitle}
      </h2>
      <p className="text-sm text-fg-muted">
        {t.referralLeadFriend} {referral.friendPercent}% {t.referralLeadYou}{" "}
        {referral.rewardPercent}% {t.referralLeadEnd}
      </p>

      {referral.code ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-line-strong bg-surface px-4 py-3">
          <code className="select-all font-mono text-2xl tracking-[0.2em]">
            {referral.code}
          </code>
          <Button
            variant="secondary"
            className="h-10"
            onClick={() => copy(referral.code ?? "")}
          >
            {copied ? (
              <Check size={16} aria-hidden />
            ) : (
              <Copy size={16} aria-hidden />
            )}
            {copied ? t.copied : t.copy}
          </Button>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-line px-4 py-3 text-sm text-fg-muted">
          {t.locked}
        </p>
      )}

      <dl className="grid grid-cols-3 gap-3 text-center">
        <Stat label={t.referred} value={String(referral.referred)} />
        <Stat label={t.earned} value={money(referral.earnedMinor)} />
        <Stat label={t.credit} value={money(billing.creditMinor)} />
      </dl>
      {billing.creditMinor > 0 && (
        <p className="text-xs text-fg-muted">{t.creditHint}</p>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-2xl bg-surface p-3">
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
