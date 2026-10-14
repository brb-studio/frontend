import { CalendarCheck, LogIn, UserPlus } from "lucide-react";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { ButtonLink } from "@/shared/ui/button";

/** Browsing without an account: booking needs one, so point to sign in or sign up. */
export function BookingGate({
  lang,
  t,
  auth,
}: {
  lang: Locale;
  t: Dictionary["booking"];
  auth: Dictionary["auth"];
}) {
  return (
    <section
      aria-labelledby="booking-gate-title"
      className="grid justify-items-center gap-4 rounded-[2rem] border border-line bg-card p-8 text-center shadow-soft"
    >
      <span
        aria-hidden="true"
        className="grid size-16 place-items-center rounded-full bg-accent text-accent-fg shadow-glow"
      >
        <CalendarCheck size={28} />
      </span>
      <h2 id="booking-gate-title" className="text-2xl font-medium">
        {t.signInTitle}
      </h2>
      <p className="max-w-sm text-fg-muted">{t.signInLead}</p>
      <div className="mt-2 grid w-full gap-3 sm:grid-cols-2">
        <ButtonLink href={`/${lang}/login`}>
          <LogIn size={18} aria-hidden="true" />
          {auth.login}
        </ButtonLink>
        <ButtonLink href={`/${lang}/register`} variant="secondary">
          <UserPlus size={18} aria-hidden="true" />
          {auth.register}
        </ButtonLink>
      </div>
    </section>
  );
}
