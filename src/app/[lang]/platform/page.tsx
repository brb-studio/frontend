import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { platformLogout } from "@/features/platform/actions";
import { Dashboard } from "@/features/platform/dashboard";
import { getPlatformStaff } from "@/features/platform/session";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { BrandMark } from "@/shared/ui/brand-mark";
import { LanguageMenu } from "@/shared/ui/language-menu";
import { Providers } from "../providers";

export default async function PlatformPage() {
  const [dict, locale, staff] = await Promise.all([
    getDictionary(),
    getLocale(),
    getPlatformStaff(),
  ]);
  if (!staff) redirect(`/${locale}/platform/login`);
  const t = dict.platform;

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-30 rounded-full bg-fg px-4 py-2 text-canvas focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {dict.a11y.skipToContent}
      </a>
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark />
            <div className="grid min-w-0">
              <span className="truncate font-medium">{t.title}</span>
              <span className="truncate text-xs text-fg-muted">
                {t.eyebrow}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="hidden truncate text-sm text-fg-muted sm:block">
              {staff.name}
            </span>
            <LanguageMenu label={dict.language.label} />
            <form action={platformLogout}>
              <input type="hidden" name="lang" value={locale} />
              <button
                type="submit"
                className="flex h-10 items-center gap-2 rounded-full px-3 text-sm transition-colors hover:bg-glass"
              >
                <LogOut size={18} aria-hidden="true" />
                <span className="max-sm:sr-only">{t.signOut}</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl px-4 py-6 outline-none md:px-8 md:py-8"
      >
        <Providers>
          <Suspense>
            <Dashboard locale={locale} t={t} />
          </Suspense>
        </Providers>
      </main>
    </div>
  );
}
