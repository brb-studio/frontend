import Image from "next/image";
import Link from "next/link";
import type { MarketingContact } from "@/shared/api/marketing-host";
import type { LandingDictionary } from "@/shared/i18n/landing";
import type { Locale } from "@/shared/i18n/locales";
import { type Cta, CtaLink, Headline, SampleLink, Section } from "./parts";

/** S9a · how it starts, and the one price. */
export function Start({ t }: { t: LandingDictionary }) {
  return (
    <Section id="precio" labelledBy="start-title" className="lp-start">
      <div className="lp-split">
        <div className="lp-copy">
          <Headline
            id="start-title"
            parts={t.start.title}
            className="lp-reveal"
          />
          <ol className="lp-numbered">
            {t.start.steps.map((step, i) => (
              <li key={step} className="lp-reveal">
                <span className="lp-mono" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        <div className="lp-price lp-reveal">
          <p className="lp-mono lp-price__label">{t.start.priceLabel}</p>
          <p className="lp-price__amount">
            <span className="lp-price__figure">{t.start.price}</span>{" "}
            <span className="lp-price__period">{t.start.period}</span>
          </p>
          <ul className="lp-price__terms">
            <li className="lp-price__term">{t.start.payment}</li>
            <li className="lp-price__term">{t.start.plan}</li>
            <li className="lp-price__term">{t.start.trial}</li>
          </ul>
        </div>
      </div>
    </Section>
  );
}

/** S9b · closing CTA over the door photo, with the contact channels. */
export function Closing({
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
  const hasChannel = !!(contact.whatsapp || contact.email);
  const sub = hasChannel
    ? contact.showcaseUrl
      ? t.closing.subBoth
      : t.closing.subDemo
    : contact.showcaseUrl
      ? t.closing.subSample
      : undefined;
  return (
    <section
      id="contacto"
      className="lp-closing"
      aria-labelledby="closing-title"
    >
      <div className="lp-closing__photo" aria-hidden="true">
        <Image
          src="/images/sample/shave.jpg"
          alt=""
          fill
          sizes="100vw"
          className="lp-cover"
        />
      </div>
      <div className="lp-wrap lp-closing__inner">
        <Headline
          id="closing-title"
          parts={
            contact.showcaseUrl ? t.closing.title : t.closing.titleNoSample
          }
        />
        {sub && <p className="lp-lede">{sub}</p>}
        {hasChannel ? (
          <div className="lp-actions">
            <CtaLink cta={cta} t={t}>
              {t.cta.demo}
            </CtaLink>
            <SampleLink contact={contact} t={t} />
            {contact.whatsapp && contact.email && (
              <a
                className="lp-button lp-button--text"
                href={`mailto:${contact.email}`}
              >
                {contact.email}
              </a>
            )}
          </div>
        ) : (
          <div className="lp-actions">
            <p className="lp-pending">{t.cta.pending}</p>
            <SampleLink contact={contact} t={t} />
          </div>
        )}
        {hasChannel && (
          <p className="lp-notice">
            {t.cta.notice}{" "}
            <Link href={`/${locale}/privacy`}>{t.cta.noticeLink}</Link>
          </p>
        )}
      </div>
    </section>
  );
}
