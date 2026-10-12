"use client";

/**
 * Stripe.js, loaded on demand from js.stripe.com as Stripe requires (never bundled). The release
 * matches the API version the backend pins. Only the few calls the payment form makes are typed.
 */
const SCRIPT_URL = "https://js.stripe.com/endive/stripe.js";

export type StripeElement = {
  mount: (target: HTMLElement) => void;
  destroy: () => void;
  on: (
    event: "ready" | "change",
    handler: (event: { complete?: boolean }) => void,
  ) => void;
};

export type StripeElements = {
  create: (type: "payment", options?: Record<string, unknown>) => StripeElement;
  submit: () => Promise<{ error?: { message?: string } }>;
};

export type StripeClient = {
  elements: (options: {
    clientSecret: string;
    appearance?: Record<string, unknown>;
    locale?: string;
  }) => StripeElements;
  confirmPayment: (options: {
    elements: StripeElements;
    confirmParams: { return_url: string };
    redirect: "if_required";
  }) => Promise<{
    error?: { type?: string; message?: string };
    paymentIntent?: { status: string };
  }>;
};

declare global {
  interface Window {
    Stripe?: (
      publishableKey: string,
      options?: { locale?: string },
    ) => StripeClient;
  }
}

let loading: Promise<NonNullable<Window["Stripe"]>> | undefined;

function loadScript() {
  loading ??= new Promise((resolve, reject) => {
    if (window.Stripe) return resolve(window.Stripe);
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () =>
      window.Stripe ? resolve(window.Stripe) : reject(new Error("Stripe.js"));
    script.onerror = () => {
      loading = undefined;
      script.remove();
      reject(new Error("Stripe.js failed to load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

const clients = new Map<string, StripeClient>();

export async function stripeClient(publishableKey: string, locale: string) {
  const key = `${publishableKey}:${locale}`;
  const cached = clients.get(key);
  if (cached) return cached;
  const Stripe = await loadScript();
  const client = Stripe(publishableKey, { locale });
  clients.set(key, client);
  return client;
}
