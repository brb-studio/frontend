/** Minutes left until a transfer expires (0 or less once it has). */
export const minutesLeft = (expiresAt: string, now = new Date()) =>
  Math.floor((Date.parse(expiresAt) - now.getTime()) / 60_000);

/** Only the last 4 digits of an account key show: "•••• 7890". */
export const masked = (key: string) =>
  key.length > 4 ? `•••• ${key.slice(-4)}` : key;

/** Stripe's minimum charge per currency, in minor units (the API's own numbers). */
const STRIPE_MIN: Record<string, number> = { MXN: 1_000, USD: 50 };

/**
 * The deposit the API asks for a total (its `depositFor`): the percentage rounded up to a whole
 * peso or dollar, raised to Stripe's minimum and never more than the total. 25 % of 250.00 → 63.00.
 */
export function depositFor(
  totalMinor: number,
  percentBps: number,
  currency: string,
) {
  const whole = Math.ceil((totalMinor * percentBps) / 1_000_000) * 100;
  return Math.min(totalMinor, Math.max(STRIPE_MIN[currency] ?? 1_000, whole));
}

/** Where the shop is in Stripe's sign-up: 0 = not started, 1 = filling it in, 2 = being reviewed, 3 = live. */
export const connectStep = (
  status: "none" | "onboarding" | "pending" | "active" | "restricted",
) =>
  status === "none"
    ? 0
    : status === "onboarding"
      ? 1
      : status === "active"
        ? 3
        : 2;
