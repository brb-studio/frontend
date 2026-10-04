import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession, isStaff } from "@/features/auth/session";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { AppNav } from "@/widgets/app-nav";
import { AppTopBar } from "@/widgets/app-top-bar";
import { Providers } from "../providers";

/** The customer app. The team never lands here: their app is the admin panel. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const [dict, locale, session] = await Promise.all([
    getDictionary(),
    getLocale(),
    getSession(),
  ]);
  if (isStaff(session)) redirect(`/${locale}/admin`);

  return (
    <>
      <AppTopBar />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-3xl px-4 pb-32 pt-6 outline-none md:pb-16 md:pt-10"
      >
        <Providers>{children}</Providers>
      </main>
      <AppNav variant="tabs" labels={dict.nav} />
    </>
  );
}
