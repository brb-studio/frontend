import type { MarketingContact } from "@/shared/api/marketing-host";
import type { LandingDictionary } from "@/shared/i18n/landing";
import type { Locale } from "@/shared/i18n/locales";
import { Brand, Rest } from "./brand";
import { SiteFooter, SiteHeader, SkipLink } from "./chrome";
import { Closing, Start } from "./closing";
import { Hero } from "./hero";
import { Ledger, Loyalty } from "./money";
import { demoCta } from "./parts";
import { Plans, Platforms } from "./plans";
import { Booking, Branches, Solo } from "./story";

/** The product landing: one day of one shop, from the first booking to the cash count. */
export function LandingPage({
  locale,
  t,
  contact,
}: {
  locale: Locale;
  t: LandingDictionary;
  contact: MarketingContact;
}) {
  const cta = demoCta(t, contact);
  const soloCta = demoCta(t, contact, true);
  return (
    <>
      <SkipLink t={t} />
      <SiteHeader locale={locale} t={t} path="" cta={cta} />
      <main id="contenido" tabIndex={-1}>
        <Hero locale={locale} t={t} cta={cta} contact={contact} />
        <Booking locale={locale} t={t} />
        <Solo locale={locale} t={t} soloCta={soloCta} />
        <Branches locale={locale} t={t} />
        <Loyalty locale={locale} t={t} />
        <Ledger locale={locale} t={t} />
        <Brand locale={locale} t={t} />
        <Rest t={t} />
        <Plans t={t} />
        <Platforms locale={locale} t={t} />
        <Start t={t} />
        <Closing locale={locale} t={t} cta={cta} contact={contact} />
      </main>
      <SiteFooter locale={locale} t={t} contact={contact} path="" />
    </>
  );
}
