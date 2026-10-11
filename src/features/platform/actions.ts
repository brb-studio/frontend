"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as z from "zod";
import { ApiError, backend, PLATFORM_COOKIE } from "@/shared/api/backend";
import { defaultLocale, hasLocale } from "@/shared/i18n/locales";

export type LoginState =
  | { error?: "invalid" | "rateLimited" | "unavailable" }
  | undefined;

const session = z.object({ token: z.string(), expiresAt: z.string() });

const localeOf = (formData: FormData) => {
  const lang = String(formData.get("lang") ?? "");
  return hasLocale(lang) ? lang : defaultLocale;
};

export async function platformLogin(
  _: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "invalid" };
  try {
    const started = await backend("/platform/auth/login", session, {
      method: "POST",
      body: { email, password },
      platform: true,
    });
    (await cookies()).set(PLATFORM_COOKIE, started.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(started.expiresAt),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 429)
      return { error: "rateLimited" };
    if (
      error instanceof ApiError &&
      (error.status === 401 || error.status === 422)
    ) {
      return { error: "invalid" };
    }
    return { error: "unavailable" };
  }
  redirect(`/${localeOf(formData)}/platform`);
}

export async function platformLogout(formData: FormData) {
  await backend("/platform/auth/logout", z.undefined(), {
    method: "POST",
    platform: true,
  }).catch(() => undefined);
  (await cookies()).delete(PLATFORM_COOKIE);
  redirect(`/${localeOf(formData)}/platform/login`);
}

export type WriteResult =
  | { ok: true; data: unknown }
  | { ok: false; code: string; message: string };

const id = z.string().regex(/^[a-f\d]{24}$/);

const write = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("commission"),
    barberId: id,
    commissionBps: z.number().int().min(0).max(10_000).nullable(),
  }),
  z.object({
    kind: z.literal("payout"),
    barberId: id,
    appointmentIds: z.array(id).min(1).max(200),
    reference: z.string().trim().max(120).optional(),
  }),
]);

export async function platformWrite(
  input: z.input<typeof write>,
): Promise<WriteResult> {
  const parsed = write.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION", message: "Invalid request" };
  }
  const body = parsed.data;
  try {
    const data =
      body.kind === "commission"
        ? await backend(
            `/platform/barbers/${body.barberId}/commission`,
            z.undefined(),
            {
              method: "PATCH",
              body: { commissionBps: body.commissionBps },
              platform: true,
            },
          )
        : await backend("/platform/payouts", z.unknown(), {
            method: "POST",
            platform: true,
            body: {
              barberId: body.barberId,
              appointmentIds: body.appointmentIds,
              ...(body.reference ? { reference: body.reference } : {}),
            },
          });
    return { ok: true, data };
  } catch (error) {
    return error instanceof ApiError
      ? { ok: false, code: error.code, message: error.message }
      : { ok: false, code: "UNAVAILABLE", message: "Unavailable" };
  }
}

const subscriptionWrite = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("confirm"),
    id,
    receivedMinor: z.number().int().min(1),
    reference: z.string().trim().max(120).optional(),
  }),
  z.object({
    action: z.literal("reject"),
    id,
    reason: z.string().trim().max(500).optional(),
  }),
]);

export async function platformSubscription(
  input: z.input<typeof subscriptionWrite>,
): Promise<WriteResult> {
  const parsed = subscriptionWrite.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION", message: "Invalid request" };
  }
  const body = parsed.data;
  try {
    const data = await backend(
      `/platform/subscriptions/${body.id}/${body.action}`,
      z.unknown(),
      {
        method: "POST",
        platform: true,
        body:
          body.action === "confirm"
            ? {
                receivedMinor: body.receivedMinor,
                ...(body.reference ? { reference: body.reference } : {}),
              }
            : body.reason
              ? { reason: body.reason }
              : {},
      },
    );
    return { ok: true, data };
  } catch (error) {
    return error instanceof ApiError
      ? { ok: false, code: error.code, message: error.message }
      : { ok: false, code: "UNAVAILABLE", message: "Unavailable" };
  }
}
