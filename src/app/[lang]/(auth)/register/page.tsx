import type { Metadata } from "next";
import Link from "next/link";
import { getTenant } from "@/entities/tenant/api";
import { AuthSheet } from "@/features/auth/form-parts";
import { RegisterForm } from "@/features/auth/register-form";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { alternates } from "@/shared/i18n/locales";

export async function generateMetadata(): Promise<Metadata> {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  return {
    title: dict.auth.register,
    alternates: alternates(locale, "/register"),
  };
}

export default async function RegisterPage() {
  const [{ auth: t, privacy }, locale, tenant] = await Promise.all([
    getDictionary(),
    getLocale(),
    getTenant(),
  ]);
  const address = tenant.branches[0]?.address.join(", ");
  const notice = privacy.simplified
    .replace("{shop}", tenant.name)
    .replace(
      "{address}",
      address ? privacy.at.replace("{address}", address) : "",
    );

  return (
    <AuthSheet
      backHref={`/${locale}`}
      backLabel={t.back}
      title={t.registerTitle}
      lead={t.registerLead}
    >
      <RegisterForm
        t={t}
        locale={locale}
        notice={notice}
        readPrivacy={privacy.read}
      />
      <p className="animate-rise text-center text-sm text-fg-muted [animation-delay:540ms]">
        {t.haveAccount}{" "}
        <Link
          href={`/${locale}/login`}
          className="font-medium text-accent-text underline-offset-4 hover:underline"
        >
          {t.toLogin}
        </Link>
      </p>
    </AuthSheet>
  );
}
