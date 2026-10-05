"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { Button } from "@/shared/ui/button";
import { CheckoutForm } from "./checkout-form";

export function PaymentForm({
  lang,
  intent,
  onPaid,
  onPayAtBranch,
  t,
}: {
  lang: Locale;
  intent: {
    clientSecret: string;
    accountId: string;
    publishableKey: string;
    amountMinor: number;
    currency: string;
  };
  onPaid: () => void;
  onPayAtBranch: () => void;
  t: Dictionary["booking"];
}) {
  const stripePromise = useMemo(
    () =>
      loadStripe(intent.publishableKey, {
        stripeAccount: intent.accountId,
      }),
    [intent.publishableKey, intent.accountId],
  );

  const [stripeBlocked, setStripeBlocked] = useState(false);
  useEffect(() => {
    let live = true;
    void stripePromise.then((stripe) => {
      if (live && !stripe) setStripeBlocked(true);
    });
    return () => {
      live = false;
    };
  }, [stripePromise]);
  if (stripeBlocked) {
    return (
      <div className="grid gap-2">
        <p className="text-sm text-fg-muted">{t.payUnavailable}</p>
        <Button variant="secondary" onClick={onPayAtBranch}>
          {t.payAtBranch}
        </Button>
      </div>
    );
  }
  return (
    <div className="grid gap-3 text-left">
      <Elements
        stripe={stripePromise}
        options={{ clientSecret: intent.clientSecret, locale: lang }}
      >
        <CheckoutForm lang={lang} onPaid={onPaid} t={t} />
      </Elements>
      <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
        <p className="text-xs text-fg-muted">{t.secureNote}</p>
        <button
          type="button"
          onClick={onPayAtBranch}
          className="shrink-0 text-xs font-medium text-fg-muted underline underline-offset-2 hover:text-fg"
        >
          {t.payAtBranch}
        </button>
      </div>
    </div>
  );
}
