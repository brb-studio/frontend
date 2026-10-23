import Image from "next/image";
import type { LandingDictionary } from "@/shared/i18n/landing";
import type { Locale } from "@/shared/i18n/locales";
import { BranchClock } from "./branch-clock";
import { type Cta, CtaLink, Headline, Section, Timecode } from "./parts";
import { ShotFrame } from "./shot";

const BOOKING_SHOTS = [
  "booking-branch",
  "booking-barber",
  "booking-date",
  "booking-time",
  "booking-confirm",
] as const;

/** S2 · the customer's booking, in five real screens. */
export function Booking({
  locale,
  t,
}: {
  locale: Locale;
  t: LandingDictionary;
}) {
  return (
    <Section id="producto" labelledBy="booking-title">
      <div className="lp-split">
        <div className="lp-copy lp-reveal">
          <Timecode time={t.booking.time} label={t.booking.label} />
          <Headline id="booking-title" parts={t.booking.title} />
          <p className="lp-body">{t.booking.sub}</p>
        </div>
        <aside className="lp-callout lp-reveal">
          <p className="lp-mono lp-callout__label">{t.booking.takenLabel}</p>
          <p className="lp-callout__quote">{t.booking.taken}</p>
        </aside>
      </div>
      <div className="lp-steps-wrap">
        <span className="lp-progress" aria-hidden="true" />
        <ol
          className="lp-steps"
          aria-label={t.booking.stripLabel}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable region must be keyboard reachable
          tabIndex={0}
        >
          {t.booking.steps.map((step, i) => (
            <li key={step.title} className="lp-step">
              <ShotFrame
                id={BOOKING_SHOTS[i] ?? "booking-confirm"}
                locale={locale}
                t={t}
                maxWidth={260}
              />
              <p className="lp-step__title">
                <span className="lp-mono">0{i + 1}</span> {step.title}
              </p>
              <p className="lp-step__body">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
      <p className="lp-note lp-reveal">{t.booking.reminder}</p>
    </Section>
  );
}

/** S3 · the owner who also cuts. */
export function Solo({
  locale,
  t,
  soloCta,
}: {
  locale: Locale;
  t: LandingDictionary;
  soloCta: Cta | undefined;
}) {
  return (
    <Section labelledBy="solo-title" className="lp-solo">
      <div className="lp-split lp-split--media-right">
        <div className="lp-copy lp-reveal">
          <Timecode time={t.solo.time} label={t.solo.label} />
          <Headline id="solo-title" parts={t.solo.title} />
          <p className="lp-body">{t.solo.body}</p>
          <p className="lp-footnote">{t.solo.footnote}</p>
          {soloCta && (
            <CtaLink cta={soloCta} t={t} variant="text">
              {t.cta.soloLink}
            </CtaLink>
          )}
        </div>
        <div className="lp-duo">
          <ShotFrame id="become-barber" locale={locale} t={t} maxWidth={300} />
          <ShotFrame
            id="my-day"
            locale={locale}
            t={t}
            maxWidth={300}
            className="lp-duo__second"
          />
        </div>
      </div>
    </Section>
  );
}

/** S4 · many branches, each on its own clock. */
export function Branches({
  locale,
  t,
}: {
  locale: Locale;
  t: LandingDictionary;
}) {
  return (
    <Section labelledBy="branches-title" className="lp-branches">
      <div className="lp-branches__photos" aria-hidden="true">
        <div className="lp-branches__photo">
          <Image
            src="/images/sample/branch-centro.jpg"
            alt=""
            fill
            sizes="50vw"
            className="lp-cover"
          />
        </div>
        <div className="lp-branches__photo">
          <Image
            src="/images/sample/branch-norte.jpg"
            alt=""
            fill
            sizes="50vw"
            className="lp-cover"
          />
        </div>
      </div>
      <div className="lp-copy lp-reveal">
        <Timecode time={t.branches.time} label={t.branches.label} />
        <Headline id="branches-title" parts={t.branches.title} />
        <p className="lp-body">{t.branches.body}</p>
      </div>
      <div className="lp-clocks">
        <p className="lp-mono lp-clocks__label">{t.branches.clocksLabel}</p>
        <div className="lp-clocks__row">
          {t.branches.clocks.map((clock) => (
            <BranchClock
              key={clock.zone}
              city={clock.city}
              zone={clock.zone}
              locale={locale}
            />
          ))}
        </div>
      </div>
      <div className="lp-roles lp-reveal">
        <p className="lp-mono lp-roles__label">{t.branches.rolesLabel}</p>
        <ul className="lp-roles__list">
          {t.branches.roles.map((role) => (
            <li key={role}>{role}</li>
          ))}
        </ul>
      </div>
      <div className="lp-media-pair">
        <ShotFrame id="agenda" locale={locale} t={t} maxWidth={720} />
        <ShotFrame id="branches" locale={locale} t={t} maxWidth={520} />
      </div>
    </Section>
  );
}
