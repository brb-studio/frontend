"use client";

import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { Button } from "@/shared/ui/button";
import { FormAlert } from "@/shared/ui/form";

export function CheckoutForm({
  lang,
  onPaid,
  t,
}: {
  lang: Locale;
  onPaid: () => void;
  t: Dictionary["booking"];
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (processing) {
    return (
      <p role="status" className="py-2 text-center text-sm text-fg-muted">
        {t.payProcessing}
      </p>
    );
  }

  async function pay() {
    if (!stripe || !elements || pending) return;
    setPending(true);
    setError(null);
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/${lang}/account`,
      },
      redirect: "if_required",
    });
    if (stripeError) {
      setError(stripeError.message ?? t.payFailed);
      setPending(false);
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      onPaid();
      return;
    }
    setPending(false);
    setProcessing(true);
  }

  return (
    <div className="grid gap-3">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && <FormAlert>{error}</FormAlert>}
      <Button disabled={!stripe || pending} onClick={() => void pay()}>
        {pending && (
          <LoaderCircle size={18} aria-hidden="true" className="animate-spin" />
        )}
        {t.payNow}
      </Button>
    </div>
  );
}
