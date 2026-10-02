import { ExternalLink, LogIn, UserPlus, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { getTenant } from "@/entities/tenant/api";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { alternates } from "@/shared/i18n/locales";
import { ButtonLink } from "@/shared/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  return {
    title: dict.account.title,
    alternates: alternates(locale, "/account"),
  };
}

export default async function AccountPage() {
  const [dict, locale, tenant] = await Promise.all([
    getDictionary(),
    getLocale(),
    getTenant(),
  ]);

  return (
    <div className="grid gap-8">
      <h1 className="animate-rise font-medium text-title">
        {dict.account.title}
      </h1>
      <section
        aria-labelledby="guest-title"
        className="grid border border-line bg-card animate-rise justify-items-center gap-4 rounded-[2rem] p-8 text-center shadow-soft [animation-delay:80ms]"
      >
        <span
          aria-hidden="true"
          className="bg-accent grid size-20 place-items-center rounded-full p-0.5"
        >
          <span className="grid size-full place-items-center rounded-full bg-surface text-accent-text">
            <UserRound size={32} />
          </span>
        </span>
        <h2 id="guest-title" className="font-medium text-2xl">
          {dict.account.guestTitle}
        </h2>
        <p className="max-w-sm text-fg-muted">{dict.account.guestLead}</p>
        <div className="mt-2 grid w-full gap-3 sm:grid-cols-2">
          <ButtonLink href={`/${locale}/login`}>
            <LogIn size={18} aria-hidden="true" />
            {dict.auth.login}
          </ButtonLink>
          <ButtonLink href={`/${locale}/register`} variant="secondary">
            <UserPlus size={18} aria-hidden="true" />
            {dict.auth.register}
          </ButtonLink>
        </div>
      </section>
      <a
        href={tenant.instagramUrl}
        className="flex border border-line bg-card animate-rise items-center justify-between rounded-3xl px-5 py-4 transition-colors hover:border-accent-text [animation-delay:160ms]"
      >
        {dict.account.instagram}
        <ExternalLink
          size={18}
          aria-hidden="true"
          className="text-accent-text"
        />
      </a>
    </div>
  );
}
