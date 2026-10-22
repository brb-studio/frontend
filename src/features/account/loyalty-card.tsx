import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { formatMoney } from "@/shared/i18n/money";
import type { Loyalty } from "./data";

export function LoyaltyCards({
  programs,
  currency,
  locale,
  t,
}: {
  programs: Loyalty;
  currency: string;
  locale: Locale;
  t: Dictionary["account"]["loyalty"];
}) {
  return programs.map((p) => {
    const reward =
      p.type === "percent" && p.value === 100
        ? t.free
        : t.off.replace(
            "{amount}",
            p.type === "percent"
              ? `${p.value}%`
              : formatMoney(p.value, currency, locale),
          );
    const next = p.visits === p.everyVisits - 1;
    return (
      <section
        key={p.id}
        aria-labelledby={`loyalty-${p.id}`}
        className="grid gap-4 rounded-[2rem] border border-line bg-card p-6"
      >
        <div className="grid gap-1">
          <h2 id={`loyalty-${p.id}`} className="font-medium">
            {t.title} · {pick(p.name, locale)}
          </h2>
          <p className="text-sm text-fg-muted">
            {t.progress
              .replace("{n}", String(p.visits))
              .replace("{total}", String(p.everyVisits))}
          </p>
        </div>
        {p.everyVisits <= 12 && (
          <ol className="flex flex-wrap gap-2" aria-hidden="true">
            {Array.from({ length: p.everyVisits }, (_, i) => i + 1).map((n) => (
              <li
                key={n}
                className={`grid size-9 place-items-center rounded-full border text-xs ${
                  n <= p.visits
                    ? "border-accent bg-accent text-accent-fg"
                    : n === p.everyVisits
                      ? "border-accent text-accent-text"
                      : "border-line text-fg-muted"
                }`}
              >
                {n}
              </li>
            ))}
          </ol>
        )}
        <p className={next ? "font-medium text-accent-text" : "text-sm"}>
          {next
            ? t.next.replace("{reward}", reward)
            : t.reward
                .replace("{total}", String(p.everyVisits))
                .replace("{reward}", reward)}
        </p>
      </section>
    );
  });
}
