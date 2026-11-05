import Image from "next/image";
import type { ReactNode } from "react";
import {
  type MarketingContact,
  mailtoHref,
  whatsappHref,
} from "@/shared/api/marketing-host";
import type { LandingDictionary } from "@/shared/i18n/landing";

/** `[before, emphasized, after?]`: one italic word per headline, as the design asks. */
export function Headline({
  as: Tag = "h2",
  parts,
  id,
  className = "",
}: {
  as?: "h1" | "h2";
  parts: readonly string[];
  id?: string;
  className?: string;
}) {
  const [before = "", em = "", after] = parts;
  return (
    <Tag id={id} className={`lp-headline ${className}`}>
      {before} <em>{em}</em>
      {after && <span className="lp-headline__after"> {after}</span>}
    </Tag>
  );
}

export function Timecode({ time, label }: { time: string; label: string }) {
  return (
    <p className="lp-timecode lp-mono">
      <span>{time}</span>
      <span className="lp-timecode__rule" aria-hidden="true" />
      <span>{label}</span>
    </p>
  );
}

export function Section({
  id,
  labelledBy,
  tone = "ink",
  photo,
  className = "",
  children,
}: {
  id?: string;
  labelledBy: string;
  tone?: "ink" | "photo";
  photo?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`lp-section lp-section--${tone} ${className}`}
    >
      {photo && (
        <div className="lp-section__photo" aria-hidden="true">
          <Image src={photo} alt="" fill sizes="100vw" className="lp-cover" />
        </div>
      )}
      <div className="lp-wrap">{children}</div>
    </section>
  );
}

export type Cta = { href: string; external: boolean; whatsapp: boolean };

/** Primary CTA: WhatsApp when the number is set, else email, else nothing (pre-launch). */
export function demoCta(
  t: LandingDictionary,
  contact: MarketingContact,
  solo = false,
): Cta | undefined {
  if (contact.whatsapp) {
    return {
      href: whatsappHref(
        contact.whatsapp,
        solo ? t.cta.whatsappSolo : t.cta.whatsapp,
      ),
      external: true,
      whatsapp: true,
    };
  }
  if (contact.email) {
    return {
      href: mailtoHref(
        contact.email,
        t.cta.emailSubject,
        solo ? t.cta.whatsappSolo : t.cta.emailBody,
      ),
      external: false,
      whatsapp: false,
    };
  }
  return undefined;
}

export function CtaLink({
  cta,
  t,
  variant = "primary",
  children,
}: {
  cta: Cta | undefined;
  t: LandingDictionary;
  variant?: "primary" | "ghost" | "text";
  children: ReactNode;
}) {
  const className = `lp-button lp-button--${variant}`;
  if (!cta) {
    // No channel yet: point to the contact section, and don't promise a demo booking.
    return (
      <a className={className} href="#contacto">
        {t.nav.contact}
      </a>
    );
  }
  return (
    <a
      className={className}
      href={cta.href}
      {...(cta.external && { target: "_blank", rel: "noopener noreferrer" })}
    >
      {children}
      {cta.whatsapp && <span className="lp-sr"> {t.cta.newTab}</span>}
    </a>
  );
}

export function SampleLink({
  contact,
  t,
  variant = "ghost",
}: {
  contact: MarketingContact;
  t: LandingDictionary;
  variant?: "ghost" | "text";
}) {
  if (!contact.showcaseUrl) return null;
  return (
    <a
      className={`lp-button lp-button--${variant}`}
      href={contact.showcaseUrl}
      rel="noopener"
    >
      {t.cta.sample}
    </a>
  );
}
