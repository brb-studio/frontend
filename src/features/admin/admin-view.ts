type Hours = { weekday: number; open: string; close: string }[];

const fold = (text: string) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase();

/** Whether `text` holds what was typed, ignoring case and accents. */
export const matches = (text: string, query: string) =>
  !query.trim() || fold(text).includes(fold(query.trim()));

/** Short weekday names, Sunday = 0 like the API. */
export const weekdayNames = (locale: string) =>
  Array.from({ length: 7 }, (_, weekday) =>
    new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" })
      .format(new Date(Date.UTC(2023, 0, 1 + weekday)))
      .replace(/\.$/, ""),
  );

const rangesOf = (hours: Hours, weekday: number) =>
  hours
    .filter((h) => h.weekday === weekday)
    .sort((a, b) => a.open.localeCompare(b.open))
    .map((h) => `${h.open}–${h.close}`)
    .join(", ");

/**
 * The week in a line: days with the same hours run together, Monday first.
 * "lun–sáb 10:00–20:00 · dom 11:00–16:00"; empty when there are no hours at all.
 */
export function hoursSummary(hours: Hours, locale: string) {
  const names = weekdayNames(locale);
  const order = [1, 2, 3, 4, 5, 6, 0];
  const runs: { from: number; to: number; ranges: string }[] = [];
  for (const weekday of order) {
    const ranges = rangesOf(hours, weekday);
    if (!ranges) continue;
    const last = runs.at(-1);
    const previous = order[order.indexOf(weekday) - 1];
    if (last && last.ranges === ranges && last.to === previous)
      last.to = weekday;
    else runs.push({ from: weekday, to: weekday, ranges });
  }
  return runs
    .map(({ from, to, ranges }) =>
      from === to
        ? `${names[from]} ${ranges}`
        : `${names[from]}–${names[to]} ${ranges}`,
    )
    .join(" · ");
}

/** Today's opening ranges on the branch's own calendar ("" when closed today). */
export function todayHours(hours: Hours, timeZone: string, now = new Date()) {
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(now);
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    day,
  );
  return rangesOf(hours, weekday);
}

/** The zone's city, as people say it: "America/Mexico_City" → "Mexico City". */
export const cityOf = (timeZone: string) =>
  (timeZone.split("/").at(-1) ?? timeZone).replaceAll("_", " ");

/** A promotion's moment in time. */
export function promoPhase(
  promo: {
    active: boolean;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
  },
  now = new Date(),
) {
  if (!promo.active) return "off" as const;
  if (promo.endsAt && Date.parse(promo.endsAt) <= now.getTime())
    return "ended" as const;
  if (promo.startsAt && Date.parse(promo.startsAt) > now.getTime())
    return "scheduled" as const;
  return "live" as const;
}

/** Uses so far against the cap, as a whole percentage (null when there is no cap). */
export const usesShare = (redemptions: number, max?: number) =>
  max ? Math.min(100, Math.round((redemptions / max) * 100)) : null;

/** An ISO instant as the value of a date box, on this device's calendar. */
export function dateBox(iso?: string) {
  if (!iso) return "";
  const at = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
}

/** A date box back to an instant: the start of that day, or its very end for an "until". */
export function fromDateBox(day: string, end = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined;
  const [y = 0, m = 1, d = 1] = day.split("-").map(Number);
  const at = end
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
  return at.toISOString();
}
