import Image from "next/image";
import Link from "next/link";
import type { MarketingContact } from "@/shared/api/marketing-host";
import type { LandingDictionary } from "@/shared/i18n/landing";
import type { Locale } from "@/shared/i18n/locales";
import { ContactForm } from "./contact-form";
import { type Cta, CtaLink, Headline, SampleLink, Section } from "./parts";

/** S9a · how it starts. */
export function Start({ t }: { t: LandingDictionary }) {
  return (
    <Section labelledBy="start-title" className="lp-start">
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
        <div className="lp-closing__copy">
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
        <ContactForm t={t.contactForm} />
      </div>
    </section>
  );
}
