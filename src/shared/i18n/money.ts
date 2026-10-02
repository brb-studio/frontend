import type { Locale } from "./locales";

export function formatMoney(minor: number, currency: string, locale: Locale) {
  const format = new Intl.NumberFormat(locale, { style: "currency", currency });
  const digits = format.resolvedOptions().maximumFractionDigits ?? 2;
  return format.format(minor / 10 ** digits);
}
