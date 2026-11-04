import type { Locale } from "./locales";

type Hours = { from: number; to: number; open: string; close: string };

const weekday = (day: number, locale: Locale) =>
  new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, 0, 7 + day)),
  );

export const formatTime = (hhmm: string, locale: Locale) => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2024, 0, 7, h, m)));
};

export const formatDate = (
  date: string,
  locale: Locale,
  options: Intl.DateTimeFormatOptions,
) =>
  new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );

/**
 * One row per run of days; a split shift (10–14 and 15–20) stays on its day's row, so no day shows
 * twice: "sábado · 10:00 – 14:00, 15:00 – 20:00".
 */
export function formatHours(hours: Hours[], locale: Locale) {
  const rows: { from: number; to: number; days: string; time: string }[] = [];
  for (const { from, to, open, close } of hours) {
    const time = `${formatTime(open, locale)} – ${formatTime(close, locale)}`;
    const row = rows.find((r) => r.from === from && r.to === to);
    if (row) {
      row.time = `${row.time}, ${time}`;
      continue;
    }
    rows.push({
      from,
      to,
      days:
        from === to
          ? weekday(from, locale)
          : `${weekday(from, locale)} – ${weekday(to, locale)}`,
      time,
    });
  }
  return rows.map(({ days, time }) => ({ days, time }));
}
