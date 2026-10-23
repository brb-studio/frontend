import Image from "next/image";
import type { MarketingContact } from "@/shared/api/marketing-host";
import type { LandingDictionary } from "@/shared/i18n/landing";
import type { Locale } from "@/shared/i18n/locales";
import { type Cta, CtaLink, Headline, SampleLink, Timecode } from "./parts";
import { ShotFrame } from "./shot";

export function Hero({
  locale,
  t,
  cta,
  contact,
}: {
  locale: Locale;
  t: LandingDictionary;
  cta: Cta | undefined;
  contact: MarketingContact;
}) {
  return (
    <section className="lp-hero" aria-labelledby="hero-title">
      <div className="lp-hero__photo" aria-hidden="true">
        <Image
          src="/images/sample/cover.jpg"
          alt=""
          fill
          sizes="100vw"
          preload
          className="lp-hero__img"
        />
      </div>
      <div className="lp-wrap lp-hero__grid">
        <div className="lp-hero__copy">
          <Timecode time={t.hero.time} label={t.hero.eyebrow} />
          <Headline
            as="h1"
            id="hero-title"
            parts={t.hero.title}
            className="lp-headline--hero"
          />
          <p className="lp-lede">{t.hero.sub}</p>
          <div className="lp-actions">
            <CtaLink cta={cta} t={t}>
              {t.cta.demo}
            </CtaLink>
            <SampleLink contact={contact} t={t} />
          </div>
        </div>
        <div className="lp-hero__device">
          <ShotFrame id="welcome" locale={locale} t={t} maxWidth={340} eager />
        </div>
      </div>
      <div className="lp-wrap">
        <p className="lp-strip lp-mono">
          <span>{t.hero.strip}</span>
          <span className="lp-strip__note">{t.hero.stripNote}</span>
        </p>
      </div>
    </section>
  );
}
