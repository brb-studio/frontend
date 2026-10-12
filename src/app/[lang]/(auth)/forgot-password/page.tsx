import type { Metadata } from "next";
import { AuthSheet } from "@/features/auth/form-parts";
import { ForgotForm } from "@/features/auth/recovery-forms";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { alternates } from "@/shared/i18n/locales";

export async function generateMetadata(): Promise<Metadata> {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  return {
    title: dict.auth.recovery.forgotTitle,
    alternates: alternates(locale, "/forgot-password"),
  };
}

export default async function ForgotPasswordPage() {
  const [{ auth: t }, locale] = await Promise.all([
    getDictionary(),
    getLocale(),
  ]);
  return (
    <AuthSheet
      backHref={`/${locale}/login`}
      backLabel={t.back}
      title={t.recovery.forgotTitle}
      lead={t.recovery.forgotLead}
    >
      <ForgotForm t={t} locale={locale} />
    </AuthSheet>
  );
}
