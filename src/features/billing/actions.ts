"use server";

import { headers } from "next/headers";
import * as z from "zod";
import { ApiError, backend } from "@/shared/api/backend";
import { hasLocale } from "@/shared/i18n/locales";
import { BILLING_ERRORS, type BillingError } from "./model";

/**
 * The owner's subscription actions. The API checks the session (owner only), the code and the return
 * URL (it must be this barbershop's own site); these only shape requests and answers.
 */

type Result<T> = { ok: true; data: T } | { ok: false; error: BillingError };

const code = z.string().trim().min(1).max(20);
const redirectUrl = z.object({ url: z.url() });

const errorOf = (error: unknown): BillingError =>
  error instanceof ApiError &&
  (BILLING_ERRORS as readonly string[]).includes(error.code)
    ? (error.code as BillingError)
    : "unknown";

/** Back to this screen on the host the owner is using (the API checks it is the tenant's own). */
async function returnUrl(lang: string) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto =
    h.get("x-forwarded-proto") ??
    (/^(localhost|[\w-]+\.localhost|127\.)/.test(host) ? "http" : "https");
  return `${proto}://${host}/${hasLocale(lang) ? lang : "es"}/admin/billing`;
}

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

/** Opens Stripe Checkout for the monthly subscription, with the friend's code when there is one. */
export async function startCheckout(
  lang: string,
  referralCode?: string,
): Promise<Result<{ url: string }>> {
  const parsedCode = referralCode ? code.safeParse(referralCode) : undefined;
  if (parsedCode && !parsedCode.success) {
    return { ok: false, error: "VALIDATION" };
  }
  try {
    const data = await backend("/v1/billing/checkout", redirectUrl, {
      method: "POST",
      body: {
        returnUrl: await returnUrl(lang),
        ...(parsedCode && { referralCode: parsedCode.data }),
      },
    });
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: errorOf(error) };
  }
}

/** Stripe's customer portal: card, invoices, cancelling. */
export async function openPortal(
  lang: string,
): Promise<Result<{ url: string }>> {
  try {
    const data = await backend("/v1/billing/portal", redirectUrl, {
      method: "POST",
      body: { returnUrl: await returnUrl(lang) },
    });
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: errorOf(error) };
  }
}
