export const PERIODS = [
  "today",
  "yesterday",
  "week",
  "lastWeek",
  "month",
  "lastMonth",
] as const;
export type Period = (typeof PERIODS)[number];

const DAY = 864e5;
const iso = (at: number) => new Date(at).toISOString().slice(0, 10);

/** Local days `from`–`to` (YYYY-MM-DD) a period covers; weeks start on Monday and never run past today. */
export function rangeOf(period: Period, today: string) {
  const now = Date.parse(`${today}T00:00:00Z`);
  const date = new Date(now);
  const sinceMonday = (date.getUTCDay() + 6) % 7;
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  switch (period) {
    case "today":
      return { from: today, to: today };
    case "yesterday":
      return { from: iso(now - DAY), to: iso(now - DAY) };
    case "week":
      return { from: iso(now - sinceMonday * DAY), to: today };
    case "lastWeek":
      return {
        from: iso(now - (sinceMonday + 7) * DAY),
        to: iso(now - (sinceMonday + 1) * DAY),
      };
    case "month":
      return { from: iso(Date.UTC(year, month, 1)), to: today };
    case "lastMonth":
      return {
        from: iso(Date.UTC(year, month - 1, 1)),
        to: iso(Date.UTC(year, month, 0)),
      };
  }
}
