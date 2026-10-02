import type { ReactNode } from "react";
import { getDictionary } from "@/shared/i18n/dictionary";
import { AppNav } from "@/widgets/app-nav";
import { AppTopBar } from "@/widgets/app-top-bar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const dict = await getDictionary();

  return (
    <>
      <AppTopBar />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-3xl px-4 pb-32 pt-6 outline-none md:pb-16 md:pt-10"
      >
        {children}
      </main>
      <AppNav variant="tabs" labels={dict.nav} />
    </>
  );
}
