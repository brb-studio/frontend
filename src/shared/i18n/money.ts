import type { Locale } from "./locales";

export function formatMoney(minor: number, currency: string, locale: Locale) {
  const format = new Intl.NumberFormat(locale, { style: "currency", currency });
  const digits = format.resolvedOptions().maximumFractionDigits ?? 2;
  return format.format(minor / 10 ** digits);
}

const digitsOf = (currency: string) =>
  new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
    .maximumFractionDigits ?? 2;

export function toMinor(value: string, currency: string) {
  const amount = Number(value.replace(",", "."));
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 10 ** digitsOf(currency));
}

export const toMajor = (minor: number, currency: string) =>
  (minor / 10 ** digitsOf(currency)).toFixed(digitsOf(currency));
