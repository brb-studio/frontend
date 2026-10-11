import { redirect } from "next/navigation";
import { PlatformLoginForm } from "@/features/platform/login-form";
import { getPlatformStaff } from "@/features/platform/session";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { BrandMark } from "@/shared/ui/brand-mark";

export default async function PlatformLoginPage() {
  const [dict, locale, staff] = await Promise.all([
    getDictionary(),
    getLocale(),
    getPlatformStaff(),
  ]);
  if (staff) redirect(`/${locale}/platform`);
  const t = dict.platform.login;

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-md content-center gap-6 px-6 py-10">
      <header className="grid justify-items-start gap-3">
        <BrandMark size="lg" />
        <h1 className="text-title font-medium">{t.title}</h1>
        <p className="text-fg-muted">{t.lead}</p>
      </header>
      <PlatformLoginForm
        t={t}
        togglePassword={dict.auth.togglePassword}
        locale={locale}
      />
    </main>
  );
}
