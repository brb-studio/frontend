import { expect, test } from "bun:test";
import { formatMoney, toMajor, toMinor } from "./money";

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

test("toMinor and toMajor convert what admins type to integer minor units and back", () => {
  expect(toMinor("300", "MXN")).toBe(30000);
  expect(toMinor("300,5", "MXN")).toBe(30050);
  expect(toMinor("0.1", "USD")).toBe(10);
  expect(toMinor("1500", "JPY")).toBe(1500);
  expect(toMinor("-1", "MXN")).toBeNull();
  expect(toMinor("abc", "MXN")).toBeNull();
  expect(toMajor(30050, "MXN")).toBe("300.50");
  expect(toMajor(1500, "JPY")).toBe("1500");
});
