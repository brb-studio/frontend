import type { LandingDictionary } from "@/shared/i18n/landing";
import type { Locale } from "@/shared/i18n/locales";
import { Headline, Section, Timecode } from "./parts";
import { ShotFrame } from "./shot";

/** S7 · the shop's own color. A real radio group recolors a type specimen with CSS only. */
export function Brand({ locale, t }: { locale: Locale; t: LandingDictionary }) {
  return (
    <Section labelledBy="brand-title" className="lp-brandsec">
      <div className="lp-split">
        <div className="lp-copy lp-reveal">
          <Timecode time={t.brand.time} label={t.brand.label} />
          <Headline id="brand-title" parts={t.brand.title} />
          <p className="lp-body">{t.brand.body}</p>
          <fieldset className="lp-swatches">
            <legend className="lp-mono">{t.brand.legend}</legend>
            {t.brand.swatches.map((swatch, i) => (
              <label
                key={swatch.value}
                className={`lp-swatch lp-swatch--${swatch.value}`}
              >
                <input
                  type="radio"
                  name="accent"
                  value={swatch.value}
                  defaultChecked={i === 2}
                />
                <span className="lp-swatch__dot" aria-hidden="true" />
                {swatch.name}
              </label>
            ))}
          </fieldset>
        </div>
        <p className="lp-specimen" aria-hidden="true">
          <span className="lp-specimen__name">{t.brand.specimen}</span>
          <span className="lp-specimen__rule" />
          <span className="lp-specimen__sub lp-mono">
            {t.brand.specimenSub}
          </span>
        </p>
      </div>
      <div className="lp-wide">
        <ShotFrame id="settings" locale={locale} t={t} maxWidth={900} />
      </div>
    </Section>
  );
}

/** S8 · the rest, as a numbered index (never an icon grid). */
export function Rest({ t }: { t: LandingDictionary }) {
  return (
    <Section
      labelledBy="rest-title"
      tone="photo"
      photo="/images/sample/bg-storefront.webp"
      className="lp-rest"
    >
      <Headline id="rest-title" parts={t.rest.title} className="lp-reveal" />
      <ol className="lp-index">
        {t.rest.items.map((item, i) => (
          <li key={item.title} className="lp-index__item lp-reveal">
            <span className="lp-mono lp-index__n" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="lp-index__title">{item.title}</h3>
            <p className="lp-index__body">{item.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
