import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { ExternalLink, LogIn, LogOut, UserPlus, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { getTenant } from "@/entities/tenant/api";
import { getMyAppointments } from "@/features/account/data";
import { myAppointmentsQuery } from "@/features/account/model";
import { MyAppointments } from "@/features/account/my-appointments";
import { logout } from "@/features/auth/actions";
import { PasswordForm } from "@/features/auth/password-form";
import { getSession } from "@/features/auth/session";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { alternates } from "@/shared/i18n/locales";
import { Button, ButtonLink } from "@/shared/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  return {
    title: dict.account.title,
    alternates: alternates(locale, "/account"),
  };
}

export default async function AccountPage() {
  const [dict, locale, tenant, session] = await Promise.all([
    getDictionary(),
    getLocale(),
    getTenant(),
    getSession(),
  ]);
  const t = dict.account;

  const instagram = (
    <a
      href={tenant.instagramUrl}
      className="flex border border-line bg-card animate-rise items-center justify-between rounded-3xl px-5 py-4 transition-colors hover:border-accent-text [animation-delay:160ms]"
    >
      {t.instagram}
      <ExternalLink size={18} aria-hidden="true" className="text-accent-text" />
    </a>
  );

  if (!session) {
    return (
      <div className="grid gap-8">
        <h1 className="animate-rise font-medium text-title">{t.title}</h1>
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
            {t.guestTitle}
          </h2>
          <p className="max-w-sm text-fg-muted">{t.guestLead}</p>
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
        {instagram}
      </div>
    );
  }

  // A customer's visits come with the page; TanStack Query keeps them fresh after cancelling.
  const queryClient = new QueryClient();
  if (session.role === "customer") {
    await queryClient.prefetchQuery({
      ...myAppointmentsQuery(),
      queryFn: getMyAppointments,
    });
  }

  return (
    <div className="grid gap-8">
      <h1 className="animate-rise font-medium text-title">{t.title}</h1>
      <section className="grid animate-rise gap-4 rounded-[2rem] border border-line bg-card p-6 shadow-soft [animation-delay:80ms]">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-full bg-accent text-xl font-medium text-accent-fg"
          >
            {session.name.charAt(0)}
          </span>
          <div className="grid min-w-0">
            <p className="text-sm text-fg-muted">{t.signedInAs}</p>
            <p className="truncate font-medium">{session.name}</p>
            <p className="truncate text-sm text-fg-muted">{session.email}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <form action={logout}>
            <input type="hidden" name="lang" value={locale} />
            <Button type="submit" variant="secondary" className="w-full">
              <LogOut size={18} aria-hidden="true" />
              {t.logout}
            </Button>
          </form>
        </div>
      </section>
      {session.role === "customer" && (
        <HydrationBoundary state={dehydrate(queryClient)}>
          <MyAppointments locale={locale} t={t} />
        </HydrationBoundary>
      )}
      <PasswordForm t={dict.auth} text={t.password} />
      {instagram}
    </div>
  );
}
