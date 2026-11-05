import type { LandingDictionary } from "@/shared/i18n/landing";
import type { Locale } from "@/shared/i18n/locales";
import { Headline, Section } from "./parts";
import { ShotFrame } from "./shot";

type PlanText = LandingDictionary["plans"];
type Plan = {
  name: string;
  price: string;
  months?: number;
  perMonth?: string;
  includes: readonly string[];
};

function PlanCard({
  plan,
  t,
  featured = false,
}: {
  plan: Plan;
  t: PlanText;
  featured?: boolean;
}) {
  return (
    <li className={`lp-plan lp-reveal${featured ? " lp-plan--featured" : ""}`}>
      {featured && <p className="lp-mono lp-plan__badge">{t.recommended}</p>}
      <h4 className="lp-plan__name">{plan.name}</h4>
      <p className="lp-plan__amount">
        <span className="lp-plan__figure">{plan.price}</span>{" "}
        <span className="lp-plan__period">
          {plan.months
            ? t.per.replace("{months}", String(plan.months))
            : t.monthly}
        </span>
      </p>
      {plan.perMonth && plan.months && (
        <p className="lp-plan__equals">
          {t.equals.replace("{amount}", plan.perMonth)}
        </p>
      )}
      <ul className="lp-price__terms">
        {plan.includes.map((item) => (
          <li key={item} className="lp-price__term">
            {item}
          </li>
        ))}
      </ul>
    </li>
  );
}

export function Plans({ t }: { t: LandingDictionary }) {
  const p = t.plans;
  return (
    <Section id="precio" labelledBy="plans-title" className="lp-plans">
      <div className="lp-copy lp-plans__head">
        <Headline id="plans-title" parts={p.title} className="lp-reveal" />
        <p className="lp-lede lp-reveal">{p.lede}</p>
      </div>
      <div className="lp-plans__group">
        <p className="lp-mono lp-plans__label">{p.firstLabel}</p>
        <h3 className="lp-plans__title">{p.firstTitle}</h3>
        <ul className="lp-plans__grid">
          <PlanCard plan={p.items.firstIos} t={p} />
          <PlanCard plan={p.items.firstAndroid} t={p} />
        </ul>
      </div>
      <div className="lp-plans__group">
        <p className="lp-mono lp-plans__label">{p.laterLabel}</p>
        <h3 className="lp-plans__title">{p.laterTitle}</h3>
        <ul className="lp-plans__grid lp-plans__grid--three">
          <PlanCard plan={p.items.monthly} t={p} />
          <PlanCard plan={p.items.sixAll} t={p} featured />
          <PlanCard plan={p.items.sixApps} t={p} />
        </ul>
      </div>
      <p className="lp-plans__note">
        {p.payment} {p.currency}
      </p>
    </Section>
  );
}

type Mark = "yes" | "no" | "soon" | "partial";
const SYMBOL: Record<Mark, string> = {
  yes: "●",
  partial: "◐",
  soon: "○",
  no: "—",
};
const isMark = (value: string): value is Mark =>
  value === "yes" || value === "no" || value === "soon" || value === "partial";

function Cell({
  value,
  t,
}: {
  value: string;
  t: LandingDictionary["platforms"];
}) {
  const mark: Mark = isMark(value) ? value : "no";
  const label = { yes: t.yes, no: t.no, soon: t.soon, partial: t.partial }[
    mark
  ];
  return (
    <td
      className={`lp-compare__c lp-compare__cell lp-compare__cell--${mark}`}
      aria-describedby={mark === "partial" ? "platforms-note" : undefined}
    >
      <span aria-hidden="true" className="lp-compare__mark">
        {SYMBOL[mark]}
      </span>{" "}
      <span className="lp-compare__label">{label}</span>
      {mark === "partial" && <sup aria-hidden="true">*</sup>}
    </td>
  );
}

export function Platforms({
  locale,
  t,
}: {
  locale: Locale;
  t: LandingDictionary;
}) {
  const p = t.platforms;
  const sides = [
    { key: "web", text: p.web, shots: ["agenda"] },
    { key: "app", text: p.app, shots: ["app-home", "app-staff"] },
  ] as const;
  return (
    <Section
      id="plataformas"
      labelledBy="platforms-title"
      tone="photo"
      photo="/images/sample/bg-industrial.jpg"
      className="lp-platforms"
    >
      <div className="lp-copy lp-plans__head">
        <Headline id="platforms-title" parts={p.title} className="lp-reveal" />
        <p className="lp-lede lp-reveal">{p.lede}</p>
      </div>
      <div className="lp-platforms__sides">
        {sides.map((side) => (
          <article key={side.key} className="lp-platform lp-reveal">
            <div
              className={`lp-platform__shots lp-platform__shots--${side.key}`}
            >
              {side.shots.map((id) => (
                <ShotFrame
                  key={id}
                  id={id}
                  locale={locale}
                  t={t}
                  maxWidth={side.key === "web" ? 640 : 260}
                />
              ))}
            </div>
            <h3 className="lp-platform__name">{side.text.name}</h3>
            <p className="lp-mono lp-platform__sub">{side.text.sub}</p>
            <ul className="lp-price__terms">
              {side.text.points.map((point) => (
                <li key={point} className="lp-price__term">
                  {point}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className="lp-compare lp-reveal">
        <table>
          <caption className="lp-platform__name">{p.tableTitle}</caption>
          <thead>
            <tr>
              <th scope="col" className="lp-compare__c lp-compare__head">
                {p.feature}
              </th>
              <th scope="col" className="lp-compare__c lp-compare__head">
                Web
              </th>
              <th scope="col" className="lp-compare__c lp-compare__head">
                iPhone
              </th>
              <th scope="col" className="lp-compare__c lp-compare__head">
                Android
              </th>
            </tr>
          </thead>
          <tbody>
            {p.rows.map((row) => (
              <tr key={row.name}>
                <th scope="row" className="lp-compare__c lp-compare__row">
                  {row.name}
                </th>
                <Cell value={row.web} t={p} />
                <Cell value={row.ios} t={p} />
                <Cell value={row.android} t={p} />
              </tr>
            ))}
          </tbody>
        </table>
        <p className="lp-compare__legend" aria-hidden="true">
          {(["yes", "partial", "soon", "no"] as const)
            .map(
              (mark) =>
                `${SYMBOL[mark]} ${{ yes: p.yes, partial: p.partial, soon: p.soon, no: p.no }[mark]}`,
            )
            .join(" · ")}
        </p>
        <p id="platforms-note" className="lp-compare__note">
          * {p.partialNote}
        </p>
      </div>
    </Section>
  );
}
