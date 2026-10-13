"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as z from "zod";
import { ApiError, backend, SESSION_COOKIE } from "@/shared/api/backend";
import { defaultLocale, hasLocale } from "@/shared/i18n/locales";
import {
  type AuthState,
  type ErrorKey,
  fieldErrors,
  forgotSchema,
  loginSchema,
  passwordChangeSchema,
  registerSchema,
  resetSchema,
  tokenSchema,
} from "./schema";

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "");

const localeOf = (formData: FormData) => {
  const lang = text(formData, "lang");
  return hasLocale(lang) ? lang : defaultLocale;
};

const session = z.object({
  token: z.string(),
  expiresAt: z.string(),
  user: z.object({ role: z.string() }),
});

async function startSession({ token, expiresAt }: z.output<typeof session>) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

function errorKey(error: unknown): ErrorKey {
  if (!(error instanceof ApiError)) return "unavailable";
  if (error.status === 401) return "invalidCredentials";
  if (error.code === "EMAIL_NOT_VERIFIED") return "emailNotVerified";
  if (error.status === 429) return "rateLimited";
  if (error.code === "INVALID_TOKEN") return "invalidToken";
  if (error.code === "EMAIL_TAKEN") return "emailTaken";
  return "unavailable";
}

export async function login(
  _: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const values = { email: text(formData, "email") };
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  let role: string;
  try {
    const started = await backend("/v1/auth/login", session, {
      method: "POST",
      body: { email: parsed.data.email, password: parsed.data.password },
    });
    await startSession(started);
    role = started.user.role;
  } catch (error) {
    return { formError: errorKey(error), values };
  }

  redirect(`/${localeOf(formData)}/${role === "customer" ? "home" : "admin"}`);
}

export async function register(
  _: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const values = {
    name: text(formData, "name"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
  };
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const { name, email, phone, password } = parsed.data;
  try {
    // No session yet: the account opens once the emailed link is followed, so a made-up address gets nowhere.
    await backend("/v1/auth/register", z.object({ user: z.object({}) }), {
      method: "POST",
      body: {
        name,
        email,
        ...(phone ? { phone } : {}),
        password,
        locale: localeOf(formData),
      },
    });
  } catch (error) {
    const key = errorKey(error);
    return key === "emailTaken"
      ? { errors: { email: [key] }, values }
      : { formError: key, values };
  }
  return { done: true, values };
}

export async function changePassword(
  _: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  try {
    await backend("/v1/auth/password", z.undefined(), {
      method: "POST",
      body: parsed.data,
    });
  } catch (error) {
    if (error instanceof ApiError && error.code === "WRONG_PASSWORD") {
      return { errors: { currentPassword: ["wrongPassword"] } };
    }
    return { formError: errorKey(error) };
  }
  return { done: true };
}

/** Always reports success for a well-formed email: whether the account exists is never shown. */
export async function forgotPassword(
  _: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const values = { email: text(formData, "email") };
  const parsed = forgotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  try {
    await backend("/v1/auth/password/forgot", z.undefined(), {
      method: "POST",
      body: { email: parsed.data.email, locale: localeOf(formData) },
    });
  } catch (error) {
    return { formError: errorKey(error), values };
  }
  return { done: true, values };
}

export async function resetPassword(
  _: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  try {
    await backend("/v1/auth/password/reset", z.undefined(), {
      method: "POST",
      body: parsed.data,
    });
  } catch (error) {
    return { formError: errorKey(error) };
  }
  return { done: true };
}

export async function verifyEmail(
  _: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = tokenSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { formError: "invalidToken" };
  try {
    await backend("/v1/auth/verify-email", z.undefined(), {
      method: "POST",
      body: parsed.data,
    });
  } catch (error) {
    return { formError: errorKey(error) };
  }
  return { done: true };
}

export async function resendVerification(
  _: AuthState,
  formData: FormData,
): Promise<AuthState> {
  try {
    await backend("/v1/auth/verify-email/request", z.undefined(), {
      method: "POST",
      body: { locale: localeOf(formData) },
    });
  } catch (error) {
    return { formError: errorKey(error) };
  }
  return { done: true };
}

export async function logout(formData: FormData) {
  await backend("/v1/auth/logout", z.undefined(), { method: "POST" }).catch(
    () => undefined,
  );
  (await cookies()).delete(SESSION_COOKIE);
  redirect(`/${localeOf(formData)}`);
}
