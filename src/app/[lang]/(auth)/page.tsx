import { LogIn, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { GetStarted } from "@/features/auth/get-started";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { alternates } from "@/shared/i18n/locales";
import { ButtonLink } from "@/shared/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: alternates(await getLocale(), "") };
}

export default async function WelcomePage() {
  const [{ welcome: t, auth }, locale] = await Promise.all([
    getDictionary(),
    getLocale(),
  ]);

  return (
    <>
      <style>
        {
          "html,body{overflow:hidden;overscroll-behavior:none}body{position:fixed;inset:0}"
        }
      </style>
      <div className="grid gap-4 px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-white md:px-0 md:pb-0 md:text-fg">
        <h1 className="animate-rise text-display font-medium text-balance [animation-delay:300ms]">
          {t.title}
        </h1>
        <p className="max-w-sm animate-rise text-white/75 [animation-delay:450ms] md:text-fg-muted">
          {t.lead}
        </p>
        <GetStarted
          label={t.start}
          sheetId="auth-sheet"
          href={`/${locale}/login`}
        />
      </div>

      <div
        id="auth-sheet"
        popover="auto"
        role="dialog"
        aria-labelledby="auth-sheet-title"
        className="group inset-x-0 top-auto bottom-0 m-0 w-full max-w-md translate-y-full rounded-t-[2rem] border border-b-0 border-line bg-sheet p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-fg opacity-0 shadow-soft backdrop-blur-2xl transition-[translate,scale,opacity,display,overlay] transition-discrete duration-700 ease-spring backdrop:bg-black/50 backdrop:backdrop-blur-sm open:translate-y-0 open:opacity-100 starting:open:translate-y-full starting:open:opacity-0 md:hidden"
      >
        <span
          aria-hidden="true"
          className="mx-auto mb-5 block h-1.5 w-10 rounded-full bg-fg/20 md:hidden"
        />
        <div
          className="grid gap-2 text-center group-open:animate-rise"
          style={{ animationDelay: "150ms" }}
        >
          <h2 id="auth-sheet-title" className="text-title font-medium">
            {t.sheetTitle}
          </h2>
          <p className="text-fg-muted">{t.sheetLead}</p>
        </div>
        <div className="mt-6 grid gap-3 *:group-open:animate-rise [&>:nth-child(1)]:[animation-delay:250ms] [&>:nth-child(2)]:[animation-delay:340ms] [&>:nth-child(3)]:[animation-delay:430ms]">
          <ButtonLink href={`/${locale}/login`}>
            <LogIn size={18} aria-hidden="true" />
            {auth.login}
          </ButtonLink>
          <ButtonLink href={`/${locale}/register`} variant="secondary">
            <UserPlus size={18} aria-hidden="true" />
            {auth.register}
          </ButtonLink>
          <Link
            href={`/${locale}/home`}
            className="justify-self-center py-2 text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline"
          >
            {auth.guest}
          </Link>
        </div>
      </div>
    </>
  );
}
