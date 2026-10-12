import { backend } from "@/shared/api/backend";
import { checkoutSchema } from "./model";

const KEY = /^pk_(test|live)_[\w]+$/;

/**
 * The Stripe publishable key for the payment form (public by design). Outside production only test
 * keys are used, and only live keys in it; anything else turns card payments off in the UI.
 */
export function publishableKey() {
  const key = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!key || !KEY.test(key)) return undefined;
  const live = key.startsWith("pk_live_");
  return live === (process.env.NODE_ENV === "production") ? key : undefined;
}

const ID = /^[a-f\d]{24}$/;
const TOKEN = /^[\w-]{1,64}$/;

export function getCheckout(
  appointmentId: string,
  paymentToken: string | undefined,
  secret: boolean,
) {
  if (!ID.test(appointmentId)) throw new Error("bad appointment id");
  const query = new URLSearchParams();
  if (paymentToken && TOKEN.test(paymentToken)) {
    query.set("paymentToken", paymentToken);
  }
  if (secret) query.set("secret", "1");
  const search = query.toString();
  return backend(
    `/v1/public/appointments/${appointmentId}/payment${search ? `?${search}` : ""}`,
    checkoutSchema,
  );
}
