import { expect, test } from "bun:test";
import { isAdminPath } from "./paths";

const id = "a".repeat(24);

test("the admin proxy reaches the payment routes owners use, and nothing else", () => {
  for (const path of [
    "payments",
    "payments/settings",
    "payments/deposit",
    "payments/stripe",
    "payments/stripe/onboarding",
    "payments/stripe/refresh",
    "payments/stripe/dashboard",
    `payments/appointments/${id}/refund`,
    `payments/${id}/confirm`,
  ]) {
    expect(isAdminPath(path)).toBe(true);
  }
  for (const path of [
    "payments/stripe/webhook",
    `payments/appointments/${id}`,
    "payments/appointments/x/refund",
    "billing/payment",
    "../platform",
  ]) {
    expect(isAdminPath(path)).toBe(false);
  }
});
