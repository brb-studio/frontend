import Image from "next/image";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getTenant } from "@/entities/tenant/api";
import { getSession, isStaff } from "@/features/auth/session";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { BrandMark } from "@/shared/ui/brand-mark";
import { LanguageMenu } from "@/shared/ui/language-menu";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [dict, tenant, locale, session] = await Promise.all([
    getDictionary(),
    getTenant(),
    getLocale(),
    getSession(),
  ]);
  // A signed-in team member (e.g. opening the installed app) goes straight to the panel.
  if (isStaff(session)) redirect(`/${locale}/admin`);

  return (
    <div className="relative isolate md:grid md:grid-cols-2">
      <a
        href="#main"
        className="sr-only z-10 rounded-full bg-fg px-4 py-2 text-canvas focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        {dict.a11y.skipToContent}
      </a>
      <div className="fixed inset-0 -z-10 md:sticky md:top-0 md:z-auto md:h-dvh md:p-3">
        <div className="relative size-full overflow-hidden bg-black md:rounded-[2rem]">
          <Image
            src={tenant.authImage}
            alt=""
            fill
            preload
            sizes="(min-width: 48rem) 50vw, 100vw"
            className="animate-settle object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-black via-black/45 to-black/25 md:via-black/10 md:to-transparent"
          />
        </div>
      </div>

      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between p-4 text-white md:px-10 md:text-fg">
          <span className="flex animate-rise items-center gap-2.5 text-lg font-medium">
            <BrandMark />
            {tenant.name}
          </span>
          <LanguageMenu label={dict.language.label} />
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="flex flex-1 flex-col justify-end outline-none md:justify-center md:px-10 md:pb-16"
        >
          <div className="mx-auto w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
