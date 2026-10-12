"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarX,
  Check,
  Copy,
  CreditCard,
  Landmark,
  LoaderCircle,
} from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { Button, ButtonLink } from "@/shared/ui/button";
import { FormAlert } from "@/shared/ui/form";
import { switchPayment } from "./actions";
import {
  type Checkout,
  checkoutKey,
  checkoutPath,
  checkoutQuery,
  checkoutSchema,
  type OnlineMethod,
  stillWaiting,
} from "./model";
import { type StripeElements, stripeClient } from "./stripe-js";

type PaymentText = Dictionary["payment"];

function CopyButton({ text, t }: { text: string; t: PaymentText }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard
          .writeText(text)
          .then(() => setCopied(true))
          .catch(() => {});
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm transition-colors hover:border-accent"
    >
      <Copy size={14} aria-hidden="true" className="text-accent" />
      {copied ? t.copied : t.copy}
    </button>
  );
}

const timeOf = (iso: string, lang: Locale) =>
  new Intl.DateTimeFormat(lang, { hour: "numeric", minute: "2-digit" }).format(
    new Date(iso),
  );

function Summary({
  checkout,
  lang,
  t,
}: {
  checkout: Checkout;
  lang: Locale;
  t: PaymentText;
}) {
  const money = (minor: number) => formatMoney(minor, checkout.currency, lang);
  return (
    <dl className="grid gap-1 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
      <div className="flex justify-between gap-4 font-medium">
        <dt>{t.toPay}</dt>
        <dd>{money(checkout.amountMinor)}</dd>
      </div>
      {checkout.balanceMinor > 0 && (
        <div className="flex justify-between gap-4 text-fg-muted">
          <dt>{t.left}</dt>
          <dd>{money(checkout.balanceMinor)}</dd>
        </div>
      )}
      {/* The API computes it: what the policy returns if the customer cancels in time. */}
      <p className="border-t border-line pt-2 text-xs text-fg-muted">
        {t.refundNote.replace("{amount}", money(checkout.refundableMinor))}
      </p>
    </dl>
  );
}

/** Stripe's Payment Element: card data goes from the browser to Stripe, never through our servers. */
function CardForm({
  checkout,
  clientSecret,
  publishableKey,
  paymentToken,
  lang,
  t,
  onPaid,
}: {
  checkout: Checkout;
  clientSecret: string;
  publishableKey: string;
  paymentToken?: string;
  lang: Locale;
  t: PaymentText;
  onPaid: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let destroyed = false;
    let element: { destroy: () => void } | undefined;
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    stripeClient(publishableKey, lang)
      .then((stripe) => {
        if (destroyed || !mountRef.current) return;
        const elements = stripe.elements({
          clientSecret,
          locale: lang,
          appearance: {
            theme: dark ? "night" : "stripe",
            variables: { borderRadius: "14px" },
          },
        });
        const payment = elements.create("payment", { layout: "tabs" });
        payment.on("ready", () => setReady(true));
        payment.mount(mountRef.current);
        elementsRef.current = elements;
        element = payment;
      })
      .catch(() => setError(t.errors.stripe));
    return () => {
      destroyed = true;
      element?.destroy();
      elementsRef.current = null;
    };
  }, [clientSecret, publishableKey, lang, t.errors.stripe]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const elements = elementsRef.current;
    if (!elements || paying) return;
    setPaying(true);
    setError(null);
    try {
      const stripe = await stripeClient(publishableKey, lang);
      const { error: invalid } = await elements.submit();
      if (invalid) {
        setError(invalid.message ?? t.errors.declined);
        return;
      }
      const returnUrl = new URL(
        `/${lang}/pay/${checkout.appointmentId}`,
        window.location.origin,
      );
      if (paymentToken) returnUrl.searchParams.set("token", paymentToken);
      // 3-D Secure may redirect; Stripe comes back to the payment page, which picks up the state.
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl.toString() },
        redirect: "if_required",
      });
      if (result.error) setError(result.error.message ?? t.errors.declined);
      else onPaid();
    } catch {
      setError(t.errors.stripe);
    } finally {
      setPaying(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      {!ready && !error && (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-fg-muted"
        >
          <LoaderCircle size={16} aria-hidden="true" className="animate-spin" />
          {t.stripeLoading}
        </p>
      )}
      <div ref={mountRef} />
      <p className="text-xs text-fg-muted">{t.cardHint}</p>
      {error && <FormAlert>{error}</FormAlert>}
      <Button type="submit" disabled={!ready || paying}>
        {paying ? (
          <LoaderCircle size={18} aria-hidden="true" className="animate-spin" />
        ) : (
          <CreditCard size={18} aria-hidden="true" />
        )}
        {t.pay.replace(
          "{amount}",
          formatMoney(checkout.amountMinor, checkout.currency, lang),
        )}
      </Button>
    </form>
  );
}

function TransferInstructions({
  checkout,
  lang,
  t,
}: {
  checkout: Checkout;
  lang: Locale;
  t: PaymentText;
}) {
  const transfer = checkout.transfer;
  if (!transfer) return null;
  const amount = formatMoney(
    transfer.amountRemainingMinor,
    checkout.currency,
    lang,
  );
  const rows = [
    { label: t.clabe, value: transfer.clabe, copy: transfer.clabe },
    {
      label: t.amount,
      value: amount,
      copy: (transfer.amountRemainingMinor / 100).toFixed(2),
    },
    ...(transfer.bankName ? [{ label: t.bank, value: transfer.bankName }] : []),
    ...(transfer.reference
      ? [
          {
            label: t.reference,
            value: transfer.reference,
            copy: transfer.reference,
          },
        ]
      : []),
  ];
  return (
    <div className="grid gap-4">
      <p className="text-sm">
        {t.transferLead
          .replace("{amount}", amount)
          .replace("{time}", timeOf(checkout.deadline, lang))}
      </p>
      <dl className="grid gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-surface px-4 py-3"
          >
            <div className="grid min-w-0">
              <dt className="text-xs text-fg-muted">{row.label}</dt>
              <dd className="font-medium break-all tabular-nums">
                {row.value}
              </dd>
            </div>
            {"copy" in row && row.copy && <CopyButton text={row.copy} t={t} />}
          </div>
        ))}
      </dl>
      <p role="status" className="flex items-center gap-2 text-sm font-medium">
        <LoaderCircle size={16} aria-hidden="true" className="animate-spin" />
        {t.waitingTransfer}
      </p>
      <p className="text-xs text-fg-muted">{t.waitingTransferLead}</p>
      {transfer.hostedUrl && (
        <a
          href={transfer.hostedUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium underline underline-offset-2"
        >
          {t.hostedInstructions}
        </a>
      )}
    </div>
  );
}

function Receipt({
  checkout,
  lang,
  t,
}: {
  checkout: Checkout;
  lang: Locale;
  t: PaymentText;
}) {
  const money = (minor: number) => formatMoney(minor, checkout.currency, lang);
  const method =
    checkout.method === "card"
      ? [
          t.card,
          checkout.cardBrand,
          checkout.cardLast4 && `•••• ${checkout.cardLast4}`,
        ]
          .filter(Boolean)
          .join(" ")
      : t.transfer;
  return (
    <div role="status" className="grid gap-4">
      <p className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-fg">
          <Check size={20} aria-hidden="true" />
        </span>
        <span className="grid">
          <span className="font-medium">{t.paidTitle}</span>
          <span className="text-sm text-fg-muted">{t.paidLead}</span>
        </span>
      </p>
      <dl className="grid gap-1 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">{t.total}</dt>
          <dd>{money(checkout.totalMinor)}</dd>
        </div>
        <div className="flex justify-between gap-4 font-medium">
          <dt>
            {t.paid} ({t.ticket.kinds[checkout.kind]})
          </dt>
          <dd>{money(checkout.amountMinor)}</dd>
        </div>
        {checkout.balanceMinor > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">{t.left}</dt>
            <dd>{money(checkout.balanceMinor)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">{t.method}</dt>
          <dd>{method}</dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Everything after "Book": pay by card or transfer, wait for Stripe's confirmation (the webhook is
 * the only source of truth, so this polls), then the receipt, or the expired state.
 */
export function PaymentCheckout({
  appointmentId,
  paymentToken,
  initial,
  publishableKey,
  methods,
  lang,
  t,
  bookAgainHref,
}: {
  appointmentId: string;
  paymentToken?: string;
  initial?: Checkout;
  publishableKey?: string;
  /** The shop's online methods: switching is only offered when the other one exists. */
  methods: OnlineMethod[];
  lang: Locale;
  t: PaymentText;
  bookAgainHref: string;
}) {
  const queryClient = useQueryClient();
  const query = useQuery({
    ...checkoutQuery(appointmentId, paymentToken),
    ...(initial && { initialData: initial }),
  });
  const checkout = query.data;
  const [secret, setSecret] = useState(initial?.clientSecret);
  const [processing, setProcessing] = useState(false);

  // Reopening an unpaid card payment (from My visits or after a reload) needs the form's secret again.
  const needsSecret =
    checkout?.method === "card" &&
    checkout.status === "pending" &&
    checkout.appointmentStatus === "pending_payment" &&
    !secret;
  useEffect(() => {
    if (!needsSecret) return;
    let cancelled = false;
    fetch(checkoutPath(appointmentId, paymentToken, true))
      .then((response) => (response.ok ? response.json() : undefined))
      .then((data: unknown) => {
        const parsed = checkoutSchema.safeParse(data);
        if (!cancelled && parsed.success && parsed.data.clientSecret) {
          setSecret(parsed.data.clientSecret);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [needsSecret, appointmentId, paymentToken]);

  const switching = useMutation({
    mutationFn: switchPayment,
    onSuccess: (result) => {
      if (!result.ok) return;
      setSecret(result.checkout.clientSecret);
      queryClient.setQueryData(checkoutKey(appointmentId), result.checkout);
    },
  });

  if (!checkout) {
    return query.isError ? (
      <FormAlert>{t.errors.unavailable}</FormAlert>
    ) : (
      <p
        role="status"
        className="flex items-center gap-2 text-sm text-fg-muted"
      >
        <LoaderCircle size={16} aria-hidden="true" className="animate-spin" />
        {t.loading}
      </p>
    );
  }

  const paid =
    checkout.status === "paid" && checkout.appointmentStatus !== "cancelled";
  if (paid) return <Receipt checkout={checkout} lang={lang} t={t} />;

  if (checkout.appointmentStatus !== "pending_payment") {
    return (
      <div role="status" className="grid gap-3">
        <p className="flex items-center gap-2 font-medium">
          <CalendarX size={18} aria-hidden="true" className="text-accent" />
          {t.expiredTitle}
        </p>
        <p className="text-sm text-fg-muted">{t.expiredLead}</p>
        <ButtonLink href={bookAgainHref}>{t.bookAgain}</ButtonLink>
      </div>
    );
  }

  const waiting = processing && stillWaiting(checkout);
  const other = checkout.method === "card" ? "bank_transfer" : "card";
  const switchTo = (method: "card" | "bank_transfer") =>
    switching.mutate({
      appointmentId,
      kind: checkout.kind,
      method,
      ...(paymentToken && { paymentToken }),
    });

  return (
    <div className="grid gap-4">
      <p className="text-sm text-fg-muted">
        {t.held.replace("{time}", timeOf(checkout.deadline, lang))}
      </p>
      <Summary checkout={checkout} lang={lang} t={t} />
      {waiting ? (
        <p role="status" className="flex items-center gap-2 font-medium">
          <LoaderCircle size={18} aria-hidden="true" className="animate-spin" />
          {t.processing}
        </p>
      ) : checkout.method === "card" ? (
        publishableKey && secret ? (
          <CardForm
            checkout={checkout}
            clientSecret={secret}
            publishableKey={publishableKey}
            paymentToken={paymentToken}
            lang={lang}
            t={t}
            onPaid={() => {
              setProcessing(true);
              void query.refetch();
            }}
          />
        ) : publishableKey ? (
          <p
            role="status"
            className="flex items-center gap-2 text-sm text-fg-muted"
          >
            <LoaderCircle
              size={16}
              aria-hidden="true"
              className="animate-spin"
            />
            {t.stripeLoading}
          </p>
        ) : (
          <FormAlert>{t.errors.stripe}</FormAlert>
        )
      ) : (
        <TransferInstructions checkout={checkout} lang={lang} t={t} />
      )}
      {switching.data && !switching.data.ok && (
        <FormAlert>{t.errors[switching.data.error]}</FormAlert>
      )}
      {!waiting && methods.includes(other) && (
        <button
          type="button"
          disabled={switching.isPending}
          onClick={() =>
            switchTo(checkout.method === "card" ? "bank_transfer" : "card")
          }
          className="inline-flex items-center justify-center gap-2 text-sm font-medium text-fg-muted underline underline-offset-2 hover:text-fg disabled:opacity-60"
        >
          {checkout.method === "card" ? (
            <Landmark size={16} aria-hidden="true" />
          ) : (
            <CreditCard size={16} aria-hidden="true" />
          )}
          {checkout.method === "card" ? t.switchToTransfer : t.switchToCard}
        </button>
      )}
    </div>
  );
}
