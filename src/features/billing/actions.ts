"use server";

import * as z from "zod";
import { ApiError, backend } from "@/shared/api/backend";
import {
  BILLING_ERRORS,
  type BillingError,
  type SubscriptionPayment,
  subscriptionPaymentSchema,
} from "./model";

type Result<T> = { ok: true; data: T } | { ok: false; error: BillingError };

const code = z.string().trim().min(1).max(20);

const errorOf = (error: unknown): BillingError =>
  error instanceof ApiError &&
  (BILLING_ERRORS as readonly string[]).includes(error.code)
    ? (error.code as BillingError)
    : "unknown";

export async function checkReferralCode(
  raw: string,
): Promise<Result<{ code: string; discountPercent: number }>> {
  const parsed = code.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };
  try {
    const data = await backend(
      "/v1/billing/referral-check",
      z.object({ code: z.string(), discountPercent: z.number().int() }),
      { method: "POST", body: { code: parsed.data } },
    );
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: errorOf(error) };
  }
}

export async function requestPayment(
  referralCode?: string,
): Promise<Result<SubscriptionPayment>> {
  const parsedCode = referralCode ? code.safeParse(referralCode) : undefined;
  if (parsedCode && !parsedCode.success) {
    return { ok: false, error: "VALIDATION" };
  }
  try {
    const data = await backend(
      "/v1/billing/payment",
      subscriptionPaymentSchema,
      {
        method: "POST",
        body: parsedCode ? { referralCode: parsedCode.data } : {},
      },
    );
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: errorOf(error) };
  }
}
