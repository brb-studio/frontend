import * as z from "zod";

export const subscriptionPaymentSchema = z.object({
  id: z.string(),
  status: z.enum(["pending", "paid", "rejected", "expired"]),
  amountMinor: z.number().int(),
  listPriceMinor: z.number().int(),
  discountMinor: z.number().int(),
  creditAppliedMinor: z.number().int(),
  currency: z.string(),
  holder: z.string(),
  clabe: z.string(),
  expiresAt: z.string(),
  referralCode: z.string().optional(),
});
export type SubscriptionPayment = z.output<typeof subscriptionPaymentSchema>;

export const billingSchema = z.object({
  price: z.object({
    amountMinor: z.number().int(),
    currency: z.string(),
    interval: z.string(),
  }),
  plan: z.enum(["trial", "basic", "pro", "lifetime"]),
  status: z.enum(["trialing", "active", "past_due", "canceled"]),
  currentPeriodEnd: z.string().optional(),
  subscribed: z.boolean(),
  creditMinor: z.number().int(),
  pending: subscriptionPaymentSchema.nullable(),
  referral: z.object({
    code: z.string().nullable(),
    friendPercent: z.number().int(),
    rewardPercent: z.number().int(),
    referred: z.number().int(),
    rewarded: z.number().int(),
    earnedMinor: z.number().int(),
  }),
  referredBy: z.object({ discountPercent: z.number().int() }).optional(),
});

export type Billing = z.output<typeof billingSchema>;

export const BILLING_ERRORS = [
  "REFERRAL_NOT_FOUND",
  "REFERRAL_SELF",
  "REFERRAL_NOT_FIRST",
  "VALIDATION",
  "RATE_LIMITED",
  "BILLING_DISABLED",
  "LIFETIME_PLAN",
] as const;
export type BillingError = (typeof BILLING_ERRORS)[number] | "unknown";
