import type { Metadata } from "next";
import Link from "next/link";
import { marketingContact } from "@/shared/api/marketing-host";
import { getLocale } from "@/shared/i18n/dictionary";
import { getLandingDictionary, MARKETING_LEGAL } from "@/shared/i18n/landing";
import { alternates } from "@/shared/i18n/locales";
import { LegalHeader, LegalList, LegalSection } from "@/shared/ui/legal";
import { SiteFooter, SiteHeader, SkipLink } from "@/widgets/landing/chrome";
import { demoCta } from "@/widgets/landing/parts";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getLandingDictionary(), getLocale()]);
  return {
    title: { absolute: t.privacy.metaTitle },
    description: t.privacy.description,
    alternates: alternates(locale, "/privacy"),
    openGraph: {
      title: t.privacy.metaTitle,
      description: t.privacy.description,
      locale: locale === "es" ? "es_MX" : "en_US",
      url: `/${locale}/privacy`,
      siteName: "brb-studio",
      type: "website",
    },
  };
}

/** brb-studio's own notice (the marketing site). The tenant notice lives at [lang]/(app)/privacy. */
export default async function MarketingPrivacy() {
  const [t, locale] = await Promise.all([getLandingDictionary(), getLocale()]);
  const p = t.privacy;
  const contact = marketingContact();
  const pending = (value: string | null) => value ?? `[${p.pending}]`;
  const updated = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${MARKETING_LEGAL.updated}T00:00:00Z`));
  const isDraft =
    !MARKETING_LEGAL.name ||
    !MARKETING_LEGAL.address ||
    !MARKETING_LEGAL.privacyContact;

  return (
    <>
      <SkipLink t={t} />
      <SiteHeader
        locale={locale}
        t={t}
        path="/privacy"
        cta={demoCta(t, contact)}
        showSections={false}
      />
      <main id="contenido" tabIndex={-1} className="lp-legal">
        <article className="grid gap-8">
          <LegalHeader
            title={p.title}
            updated={p.updated.replace("{date}", updated)}
          />
          {isDraft && (
            <p className="lp-legal__draft" role="note">
              {p.draft}
            </p>
          )}
          <div className="grid gap-8 text-fg-muted">
            <LegalSection title={p.controller.title}>
              <p>
                {p.controller.body.replace(
                  "{name}",
                  pending(MARKETING_LEGAL.name),
                )}
              </p>
              <p>
                {p.controller.address.replace(
                  "{address}",
                  pending(MARKETING_LEGAL.address),
                )}
              </p>
              <p>
                {p.controller.contact.replace(
                  "{contact}",
                  pending(MARKETING_LEGAL.privacyContact),
                )}
              </p>
            </LegalSection>
            <LegalSection title={p.data.title}>
              <LegalList items={p.data.body} />
            </LegalSection>
            <LegalSection title={p.purposes.title}>
              <LegalList items={p.purposes.body} />
              <p>{p.purposes.note}</p>
            </LegalSection>
            <LegalSection title={p.processors.title}>
              <p>{p.processors.body}</p>
            </LegalSection>
            <LegalSection title={p.shops.title}>
              <p>{p.shops.body}</p>
            </LegalSection>
            <LegalSection title={p.rights.title}>
              <p>{p.rights.body}</p>
            </LegalSection>
            <LegalSection title={p.changes.title}>
              <p>{p.changes.body}</p>
            </LegalSection>
          </div>
          <p>
            <Link href={`/${locale}`} className="lp-button lp-button--ghost">
              {p.back}
            </Link>
          </p>
        </article>
      </main>
      <SiteFooter locale={locale} t={t} contact={contact} path="/privacy" />
    </>
  );
}
