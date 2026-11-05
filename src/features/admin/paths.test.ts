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
    "appointments/my-day",
    `appointments/${id}/slots`,
    "products",
    `products/${id}`,
    "product-orders",
    "product-orders/scan",
    `product-orders/${id}/deliver`,
    `product-orders/${id}/cancel`,
    "earnings/summary",
    "customers",
    "cash",
    "money/summary",
    "money/movements",
    "money/entries",
    "barbers/me",
    `users/${id}/password`,
  ]) {
    expect(isAdminPath(path)).toBe(true);
  }
  for (const path of [
    "payments/stripe/webhook",
    `payments/appointments/${id}`,
    "payments/appointments/x/refund",
    "billing/payment",
    "../platform",
    "appointments/my-day/x",
    "users/x/password",
    `users/${id}/password/x`,
    "appointments/x/slots",
    `appointments/${id}/slots/x`,
    "product-orders/x/deliver",
    `product-orders/${id}/refund`,
    "products/x",
    "customers/x",
    "barbers/you",
    "money",
    "money/entries/x",
  ]) {
    expect(isAdminPath(path)).toBe(false);
  }
});
