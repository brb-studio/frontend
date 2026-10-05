import * as z from "zod";

/** GET /v1/billing: the owner's subscription, its price, and their referral numbers. */
export const billingSchema = z.object({
  price: z
    .object({
      amountMinor: z.number().int(),
      currency: z.string(),
      interval: z.string(),
    })
    .nullable(),
  plan: z.enum(["trial", "basic", "pro", "lifetime"]),
  status: z.enum(["trialing", "active", "past_due", "canceled"]),
  currentPeriodEnd: z.string().optional(),
  subscribed: z.boolean(),
  creditMinor: z.number().int(),
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

/** The API's error codes this screen explains; anything else reads as "unknown". */
export const BILLING_ERRORS = [
  "REFERRAL_NOT_FOUND",
  "REFERRAL_SELF",
  "REFERRAL_NOT_FIRST",
  "VALIDATION",
  "RATE_LIMITED",
  "ALREADY_SUBSCRIBED",
] as const;
export type BillingError = (typeof BILLING_ERRORS)[number] | "unknown";
