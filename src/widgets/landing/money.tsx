import type { CSSProperties } from "react";
import type { LandingDictionary } from "@/shared/i18n/landing";
import type { Locale } from "@/shared/i18n/locales";
import { Headline, Section, Timecode } from "./parts";
import { ShotFrame } from "./shot";
import { WidgetExample } from "./widget-example";

const STAMPS = 6;
const FILLED = 4;

/** S5 · the stamp card and the customer list. */
export function Loyalty({
  locale,
  t,
}: {
  locale: Locale;
  t: LandingDictionary;
}) {
  return (
    <Section labelledBy="loyalty-title" className="lp-loyalty">
      <div className="lp-split">
        <div className="lp-copy lp-reveal">
          <Timecode time={t.loyalty.time} label={t.loyalty.label} />
          <Headline id="loyalty-title" parts={t.loyalty.title} />
          <p className="lp-body">{t.loyalty.body}</p>
          <div className="lp-card">
            <p className="lp-mono lp-card__title">{t.loyalty.card}</p>
            <div
              className="lp-stamps"
              role="img"
              aria-label={t.loyalty.stampsLabel
                .replace("{n}", String(FILLED))
                .replace("{total}", String(STAMPS))}
            >
              {Array.from({ length: STAMPS }, (_, i) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed decorative row
                  key={i}
                  className={i < FILLED ? "lp-stamp is-filled" : "lp-stamp"}
                  style={{ "--i": i } as CSSProperties}
                />
              ))}
            </div>
            <p className="lp-card__progress" aria-hidden="true">
              {t.loyalty.progress}
            </p>
          </div>
          <WidgetExample t={t} filled={FILLED} total={STAMPS} />
        </div>
        <ShotFrame id="loyalty" locale={locale} t={t} maxWidth={320} />
      </div>
      <div className="lp-wide lp-reveal">
        <ShotFrame id="customers" locale={locale} t={t} maxWidth={1100} />
        <p className="lp-note">{t.loyalty.note}</p>
      </div>
    </Section>
  );
}

/** S6 · closing the day: cash desk and the month's revenue. The climax. */
export function Ledger({
  locale,
  t,
}: {
  locale: Locale;
  t: LandingDictionary;
}) {
  const r = t.ledger.receipt;
  return (
    <Section
      labelledBy="ledger-title"
      tone="photo"
      photo="/images/sample/bg-brick-lamps.jpg"
      className="lp-ledger"
    >
      <div className="lp-split">
        <div className="lp-copy lp-reveal">
          <Timecode time={t.ledger.time} label={t.ledger.label} />
          <Headline id="ledger-title" parts={t.ledger.title} />
          <p className="lp-body">{t.ledger.body}</p>
        </div>
        <div className="lp-receipt-wrap">
          <table className="lp-receipt">
            <caption className="lp-mono">{r.caption}</caption>
            <thead>
              <tr>
                <th scope="col">{r.method}</th>
                <th scope="col">{r.amount}</th>
              </tr>
            </thead>
            <tbody>
              {r.rows.map(([method, amount]) => (
                <tr key={method}>
                  <th scope="row">{method}</th>
                  <td>{amount}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">{r.total}</th>
                <td>{r.totalAmount}</td>
              </tr>
            </tfoot>
          </table>
          <p className="lp-footnote">{r.note}</p>
        </div>
      </div>
      <div className="lp-ledger__shots">
        <ShotFrame
          id="counter"
          locale={locale}
          t={t}
          maxWidth={300}
          className="lp-ledger__phone"
        />
        <ShotFrame id="cash" locale={locale} t={t} maxWidth={900} />
      </div>
      <div className="lp-wide">
        <p className="lp-body lp-reveal">{t.ledger.second}</p>
        <ShotFrame id="revenue" locale={locale} t={t} maxWidth={1100} />
      </div>
    </Section>
  );
}
