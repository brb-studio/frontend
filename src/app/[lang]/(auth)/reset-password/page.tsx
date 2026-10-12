import type { Metadata } from "next";
import Link from "next/link";
import { AuthSheet } from "@/features/auth/form-parts";
import { ResetForm } from "@/features/auth/recovery-forms";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: dict.auth.recovery.resetTitle,
    robots: { index: false, follow: false },
  };
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ auth: t }, locale, { token }] = await Promise.all([
    getDictionary(),
    getLocale(),
    searchParams,
  ]);
  return (
    <AuthSheet
      backHref={`/${locale}/login`}
      backLabel={t.back}
      title={t.recovery.resetTitle}
      lead={t.recovery.resetLead}
    >
      {token ? (
        <ResetForm t={t} locale={locale} token={token} />
      ) : (
        <p className="grid gap-3">
          <span role="alert" className="text-danger">
            {t.recovery.resetMissing}
          </span>
          <Link
            href={`/${locale}/forgot-password`}
            className="font-medium text-accent-text underline-offset-4 hover:underline"
          >
            {t.recovery.askAgain}
          </Link>
        </p>
      )}
    </AuthSheet>
  );
}
