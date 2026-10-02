"use server";

import { redirect } from "next/navigation";
import { defaultLocale, hasLocale } from "@/shared/i18n/locales";
import {
  type AuthState,
  fieldErrors,
  loginSchema,
  registerSchema,
} from "./schema";

function enterApp(
  lang: FormDataEntryValue | null,
  values: Record<string, string>,
) {
  if (process.env.AUTH_DEMO !== "true") {
    return { formError: "unavailable", values } satisfies AuthState;
  }
  const locale =
    typeof lang === "string" && hasLocale(lang) ? lang : defaultLocale;
  redirect(`/${locale}/home`);
}

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "");

export async function login(
  _: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const values = { email: text(formData, "email") };
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  return enterApp(formData.get("lang"), values);
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
  return enterApp(formData.get("lang"), values);
}
