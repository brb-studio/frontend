import { expect, test } from "bun:test";
import { connectStep, depositFor, masked, minutesLeft } from "./money-view";

test("minutes left until a transfer expires", () => {
  const now = new Date("2026-11-03T12:00:00Z");
  expect(minutesLeft("2026-11-03T14:30:00Z", now)).toBe(150);
  expect(minutesLeft("2026-11-03T11:00:00Z", now)).toBeLessThan(0);
});

test("an account key shows only its last 4 digits", () => {
  expect(masked("012180001234567890")).toBe("•••• 7890");
});

test("the deposit follows the API: up to a whole peso, at least Stripe's minimum, never over the total", () => {
  expect(depositFor(25_000, 2_500, "MXN")).toBe(6_300);
  expect(depositFor(30_000, 3_000, "MXN")).toBe(9_000);
  expect(depositFor(2_000, 1_000, "MXN")).toBe(1_000);
  expect(depositFor(800, 5_000, "MXN")).toBe(800);
  expect(depositFor(3_000, 1_000, "USD")).toBe(300);
});

test("Stripe's sign-up reads as steps", () => {
  expect(connectStep("none")).toBe(0);
  expect(connectStep("onboarding")).toBe(1);
  expect(connectStep("pending")).toBe(2);
  expect(connectStep("restricted")).toBe(2);
  expect(connectStep("active")).toBe(3);
});
