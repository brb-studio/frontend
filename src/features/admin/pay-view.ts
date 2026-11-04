import { rangeOf } from "./periods";

/** How barbers are usually paid: by the week, the fortnight or the month; any range otherwise. */
export const PAY_PERIODS = [
  "week",
  "lastWeek",
  "fortnight",
  "month",
  "lastMonth",
  "custom",
] as const;
export type PayPeriod = (typeof PAY_PERIODS)[number];

/** The days a pay period covers (YYYY-MM-DD); the fortnight is the 1st–15th or the 16th–today. */
export function payRange(
  period: Exclude<PayPeriod, "custom">,
  today: string,
): { from: string; to: string } {
  if (period !== "fortnight") return rangeOf(period, today);
  const day = Number(today.slice(8, 10));
  return { from: `${today.slice(0, 8)}${day <= 15 ? "01" : "16"}`, to: today };
}

type Row = {
  name: string;
  commission: number;
  paidOut: number;
  pending: number;
  unconfigured: number;
};

/** The period across every barber: what they earned, what was paid and what is owed. */
export function payTotals(rows: Row[]) {
  return {
    commission: rows.reduce((sum, r) => sum + r.commission, 0),
    paidOut: rows.reduce((sum, r) => sum + r.paidOut, 0),
    pending: rows.reduce((sum, r) => sum + r.pending, 0),
    owed: rows.filter((r) => r.pending > 0).length,
    unconfigured: rows.filter((r) => r.unconfigured > 0).map((r) => r.name),
  };
}

/** Whoever is owed most first; the rest by name. */
export const owedFirst = <R extends Row>(rows: R[]) =>
  [...rows].sort(
    (a, b) => b.pending - a.pending || a.name.localeCompare(b.name),
  );
