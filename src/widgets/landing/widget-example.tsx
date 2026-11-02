import type { CSSProperties } from "react";
import type { LandingDictionary } from "@/shared/i18n/landing";

/** The iPhone widget that shows the stamp card on the home screen, next to the card in the app. */
export function WidgetExample({
  t,
  filled,
  total,
}: {
  t: LandingDictionary;
  filled: number;
  total: number;
}) {
  const copy = t.loyalty.widget;
  return (
    <figure className="lp-widget lp-reveal">
      <div className="lp-widget__tile" role="img" aria-label={copy.label}>
        <p className="lp-widget__name">{copy.name}</p>
        <div className="lp-stamps" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed decorative row
              key={i}
              className={i < filled ? "lp-stamp is-filled" : "lp-stamp"}
              style={{ "--i": i } as CSSProperties}
            />
          ))}
        </div>
        <p className="lp-widget__progress">
          {filled} / {total}
        </p>
        <p className="lp-widget__reward">{copy.reward}</p>
      </div>
      <figcaption className="lp-note">{copy.caption}</figcaption>
    </figure>
  );
}
