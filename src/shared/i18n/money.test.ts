import { expect, test } from "bun:test";
import { formatMoney } from "./money";

const intl = (amount: number, currency: string, locale: string) =>
  new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);

test.each([
  [3500, "USD", "en", 35],
  [1999, "USD", "es", 19.99],
  [15000, "CLP", "es", 15000],
  [1200, "JPY", "en", 1200],
  [1500, "KWD", "en", 1.5],
] as const)(
  "formatMoney(%p, %p, %p) = %p in major units",
  (minor, currency, locale, major) => {
    expect(formatMoney(minor, currency, locale)).toBe(
      intl(major, currency, locale),
    );
  },
);
