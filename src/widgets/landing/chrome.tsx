import Link from "next/link";
import type { MarketingContact } from "@/shared/api/marketing-host";
import type { LandingDictionary } from "@/shared/i18n/landing";
import { type Locale, localeNames, locales } from "@/shared/i18n/locales";
import { MobileNav } from "./mobile-nav";
import { type Cta, CtaLink } from "./parts";

export function SkipLink({ t }: { t: LandingDictionary }) {
  return (
    <a className="lp-skip" href="#contenido">
      {t.a11y.skip}
    </a>
  );
}

/** Plain links, no client JS: the marketing site has two languages and one page per path. */
export function LanguageLinks({
  locale,
  path,
  t,
  label = t.a11y.language,
}: {
  locale: Locale;
  path: string;
  t: LandingDictionary;
  label?: string;
}) {
  return (
    <nav aria-label={label} className="lp-langs">
      <ul>
        {locales.map((l) => (
          <li key={l}>
            <Link
              href={`/${l}${path}`}
              hrefLang={l}
              lang={l}
              aria-current={l === locale ? "true" : undefined}
              prefetch={false}
            >
              <span aria-hidden="true">{l.toUpperCase()}</span>
              <span className="lp-sr">{localeNames[l]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteHeader({
  locale,
  t,
  path,
  cta,
  showSections = true,
}: {
  locale: Locale;
  t: LandingDictionary;
  path: string;
  cta: Cta | undefined;
  showSections?: boolean;
}) {
  return (
    <header className="lp-header">
      <div className="lp-header__inner">
        <Link href={`/${locale}`} className="lp-brand" aria-label={t.a11y.home}>
          brb<span aria-hidden="true">·</span>studio
        </Link>
        {showSections && (
          <nav aria-label={t.a11y.nav} className="lp-header__nav">
            <a href="#producto">{t.nav.product}</a>
            <a href="#precio">{t.nav.pricing}</a>
            <a href="#contacto">{t.nav.contact}</a>
          </nav>
        )}
        <div className="lp-header__end">
          <LanguageLinks locale={locale} path={path} t={t} />
          {showSections && (
            <CtaLink cta={cta} t={t} variant="primary">
              {t.cta.demo}
            </CtaLink>
          )}
          {showSections && <MobileNav nav={t.nav} a11y={t.a11y} />}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({
  locale,
  t,
  contact,
  path,
}: {
  locale: Locale;
  t: LandingDictionary;
  contact: MarketingContact;
  path: string;
}) {
  const year = new Date().getFullYear();
  return (
    <footer className="lp-footer">
      <div className="lp-wrap lp-footer__grid">
        <p className="lp-brand">
          brb<span aria-hidden="true">·</span>studio
        </p>
        <ul className="lp-footer__links">
          <li>
            <Link href={`/${locale}/privacy`}>{t.footer.privacy}</Link>
          </li>
          {contact.email && (
            <li>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </li>
          )}
        </ul>
        <LanguageLinks
          locale={locale}
          path={path}
          t={t}
          label={`${t.a11y.language} (${t.a11y.footer})`}
        />
        <div className="lp-footer__fine">
          <p>{t.footer.sample}</p>
          <p>{t.footer.credits}</p>
          <p>{t.footer.rights.replace("{year}", String(year))}</p>
        </div>
      </div>
    </footer>
  );
}
