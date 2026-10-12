import type { Metadata } from "next";
import Link from "next/link";
import { AuthSheet } from "@/features/auth/form-parts";
import { VerifyForm } from "@/features/auth/recovery-forms";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: dict.auth.recovery.verifyTitle,
    robots: { index: false, follow: false },
  };
}

/** Outside the (auth) group on purpose: staff who are already signed in must still be able to confirm. */
export default async function VerifyEmailPage({
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
    <main
      id="main"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10"
    >
      <AuthSheet
        backHref={`/${locale}`}
        backLabel={t.back}
        title={t.recovery.verifyTitle}
        lead={t.recovery.verifyLead}
      >
        {token ? (
          <VerifyForm t={t} locale={locale} token={token} />
        ) : (
          <p role="alert" className="text-danger">
            {t.errors.invalidToken}{" "}
            <Link
              href={`/${locale}`}
              className="font-medium text-accent-text underline-offset-4 hover:underline"
            >
              {t.recovery.verifyContinue}
            </Link>
          </p>
        )}
      </AuthSheet>
    </main>
  );
}
