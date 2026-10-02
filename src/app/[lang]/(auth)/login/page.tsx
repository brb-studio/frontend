import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthSheet } from "@/features/auth/form-parts";
import { LoginForm } from "@/features/auth/login-form";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { alternates } from "@/shared/i18n/locales";
import { ButtonLink } from "@/shared/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  return { title: dict.auth.login, alternates: alternates(locale, "/login") };
}

export default async function LoginPage() {
  const [{ auth: t }, locale] = await Promise.all([
    getDictionary(),
    getLocale(),
  ]);

  return (
    <AuthSheet
      backHref={`/${locale}`}
      backLabel={t.back}
      title={t.loginTitle}
      lead={t.loginLead}
    >
      <LoginForm t={t} locale={locale} />
      <p className="flex animate-rise items-center gap-4 text-sm text-fg-muted [animation-delay:420ms] before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
        {t.or}
      </p>
      <ButtonLink
        href={`/${locale}/home`}
        variant="secondary"
        className="w-full animate-rise [animation-delay:480ms]"
      >
        {t.guest}
        <ArrowRight size={18} aria-hidden="true" />
      </ButtonLink>
      <p className="animate-rise text-center text-sm text-fg-muted [animation-delay:540ms]">
        {t.noAccount}{" "}
        <Link
          href={`/${locale}/register`}
          className="font-medium text-accent-text underline-offset-4 hover:underline"
        >
          {t.toRegister}
        </Link>
      </p>
    </AuthSheet>
  );
}
