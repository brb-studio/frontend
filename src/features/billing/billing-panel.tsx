"use client";

import { Check, Copy, CreditCard, Gift, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState, useTransition } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { checkReferralCode, openPortal, startCheckout } from "./actions";
import type { Billing, BillingError } from "./model";

type Text = Dictionary["admin"]["billing"];

/** After Stripe sends the owner back, the webhook may still be on its way: re-read a few times. */
const POLL_MS = 2_000;
const POLL_TIMES = 10;

export function BillingPanel({
  billing,
  lang,
  returned,
  t,
}: {
  billing: Billing;
  lang: Locale;
  returned?: "success" | "cancel";
  t: Text;
}) {
  const router = useRouter();
  const lifetime = billing.plan === "lifetime";
  const waiting = returned === "success" && !billing.subscribed;
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (!waiting) return;
    let times = 0;
    const timer = setInterval(() => {
      times += 1;
      router.refresh();
      if (times >= POLL_TIMES) {
        clearInterval(timer);
        setGaveUp(true);
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [waiting, router]);

  const money = (minor: number) =>
    formatMoney(minor, billing.price?.currency ?? "MXN", lang);

  return (
    <div className="grid max-w-xl gap-6">
      {returned === "success" && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-2xl border border-accent/40 p-3 text-sm text-accent-text"
        >
          {waiting && !gaveUp ? (
            <LoaderCircle size={16} className="animate-spin" aria-hidden />
          ) : (
            <Check size={16} aria-hidden />
          )}
          {!waiting ? t.activated : gaveUp ? t.slow : t.success}
        </p>
      )}
      {returned === "cancel" && (
        <p role="status" className="text-sm text-fg-muted">
          {t.cancelled}
        </p>
      )}

      <SubscriptionCard billing={billing} lang={lang} money={money} t={t} />

      {!lifetime && billing.price && (
        <ReferralCard billing={billing} money={money} t={t} />
      )}
    </div>
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
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{
    code: string;
    discountPercent: number;
  }>();
  const [error, setError] = useState<BillingError>();
  const [pending, startTransition] = useTransition();
  const lifetime = billing.plan === "lifetime";
  const canSubscribe = !lifetime && !billing.subscribed && billing.price;
  const end =
    billing.currentPeriodEnd &&
    new Intl.DateTimeFormat(lang, { dateStyle: "long" }).format(
      new Date(billing.currentPeriodEnd),
    );

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await checkReferralCode(code);
      setError(result.ok ? undefined : result.error);
      setApplied(result.ok ? result.data : undefined);
    });
  }

  /** Stripe's pages live on stripe.com: a full navigation, not a client-side route. */
  function go(action: () => ReturnType<typeof openPortal>) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) window.location.assign(result.data.url);
      else setError(result.error);
    });
  }

  const discounted =
    applied && billing.price
      ? Math.round(
          (billing.price.amountMinor * (100 - applied.discountPercent)) / 100,
        )
      : undefined;

  return (
    <section className="grid gap-5 rounded-[2rem] border border-line bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-sm text-fg-muted">{t.product}</p>
          {billing.price && !lifetime && (
            <p className="text-3xl font-medium">
              {money(billing.price.amountMinor)}
              <span className="text-base text-fg-muted">{t.perMonth}</span>
            </p>
          )}
        </div>
        <span className="rounded-full border border-line px-3 py-1 text-sm">
          {t.status[billing.status]}
        </span>
      </div>

      {lifetime && <p className="text-sm text-fg-muted">{t.lifetime}</p>}
      {!lifetime && !billing.price && (
        <p className="text-sm text-fg-muted">{t.disabled}</p>
      )}
      {!lifetime && end && (
        <p className="text-sm text-fg-muted">
          {billing.subscribed && billing.status !== "canceled"
            ? t.renews
            : t.endsOn}{" "}
          {end}
        </p>
      )}
      {billing.referredBy && (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <Gift size={16} aria-hidden />
          {t.referredBy} {billing.referredBy.discountPercent}% {t.off}.
        </p>
      )}

      {canSubscribe && (
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
                  {money(billing.price?.amountMinor ?? 0)}
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

      {canSubscribe && (
        <Button
          disabled={pending || Boolean(code.trim() && !applied)}
          onClick={() => go(() => startCheckout(lang, applied?.code))}
        >
          {pending ? (
            <LoaderCircle size={18} className="animate-spin" aria-hidden />
          ) : (
            <CreditCard size={18} aria-hidden />
          )}
          {t.subscribe}
        </Button>
      )}
      {!lifetime && billing.subscribed && (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => go(() => openPortal(lang))}
        >
          <CreditCard size={18} aria-hidden />
          {t.manage}
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
    } catch {
      // No clipboard permission: the code stays visible and selectable.
    }
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
