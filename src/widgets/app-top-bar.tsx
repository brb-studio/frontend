import Link from "next/link";
import { getTenant } from "@/entities/tenant/api";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { BrandMark } from "@/shared/ui/brand-mark";
import { LanguageMenu } from "@/shared/ui/language-menu";
import { AppNav } from "./app-nav";

export async function AppTopBar() {
  const [dict, locale, tenant] = await Promise.all([
    getDictionary(),
    getLocale(),
    getTenant(),
  ]);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <a
        href="#main"
        className="sr-only rounded-full bg-fg px-4 py-2 text-canvas focus:not-sr-only focus:absolute focus:left-4 focus:top-3"
      >
        {dict.a11y.skipToContent}
      </a>
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4">
        <Link
          href={`/${locale}/home`}
          className="flex items-center gap-2.5 font-medium text-xl"
        >
          <BrandMark />
          {tenant.name}
        </Link>
        <AppNav variant="top" labels={dict.nav} />
        <LanguageMenu label={dict.language.label} />
      </div>
    </header>
  );
}
