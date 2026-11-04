const DAY = 864e5;
const at = (day: string) => Date.parse(`${day}T00:00:00Z`);
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** The same number of days right before `from`–`to`: what a period is compared with. */
export function previousRange(from: string, to: string) {
  const days = Math.round((at(to) - at(from)) / DAY) + 1;
  return { from: iso(at(from) - days * DAY), to: iso(at(from) - DAY) };
}

/** How much a number moved against the one before, as a whole percentage (null when there was nothing before). */
export const changeOf = (now: number, before: number) =>
  before > 0 ? Math.round(((now - before) / before) * 100) : null;

/** Each way money came in, with its share of the total, biggest first (none that are zero). */
export function breakdown<K extends string>(parts: [K, number][]) {
  const total = parts.reduce((sum, [, minor]) => sum + minor, 0);
  return parts
    .filter(([, minor]) => minor > 0)
    .map(([key, minor]) => ({
      key,
      minor,
      share: total > 0 ? Math.round((minor / total) * 100) : 0,
    }))
    .sort((a, b) => b.minor - a.minor);
}

/** The day that made the most (none when nothing was made). */
export function bestDay<D extends { totalMinor: number }>(days: D[]) {
  let best: D | undefined;
  for (const day of days)
    if (day.totalMinor > 0 && (!best || day.totalMinor > best.totalMinor))
      best = day;
  return best;
}

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
