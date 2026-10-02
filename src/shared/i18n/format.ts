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

export const formatHours = (hours: Hours[], locale: Locale) =>
  hours.map(({ from, to, open, close }) => ({
    days:
      from === to
        ? weekday(from, locale)
        : `${weekday(from, locale)} – ${weekday(to, locale)}`,
    time: `${formatTime(open, locale)} – ${formatTime(close, locale)}`,
  }));
