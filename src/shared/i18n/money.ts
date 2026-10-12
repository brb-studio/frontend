import type { Locale } from "./locales";

// Spanish amounts use the Mexican convention (25.00, 1,234.50) instead of the
// generic "es" one (25,00).
const moneyLocale = (locale: Locale) => (locale === "es" ? "es-MX" : locale);

export function formatMoney(minor: number, currency: string, locale: Locale) {
  const format = new Intl.NumberFormat(moneyLocale(locale), {
    style: "currency",
    currency,
  });
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
