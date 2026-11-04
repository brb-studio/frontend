"use client";

import { BadgePercent, Ticket, Zap } from "lucide-react";
import { type FormEvent, useState } from "react";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney, toMajor, toMinor } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { dateBox, fromDateBox } from "./admin-view";
import { useAdminAction } from "./api";
import { FormSection } from "./catalog-inputs";
import type { AdminPromotion } from "./schemas";
import { PriceField } from "./service-form";
import { type AdminText, Result, Toggle, value } from "./ui";

type Kind = "percent" | "fixed";
type How = "code" | "auto";

function Choice<K extends string>({
  name,
  value: current,
  options,
  onChange,
  disabled = false,
}: {
  name: string;
  value: K;
  options: { key: K; title: string; hint?: string; icon: typeof Zap }[];
  onChange: (key: K) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
      {options.map(({ key, title, hint, icon: Icon }) => {
        const on = current === key;
        return (
          <label
            key={key}
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 text-sm transition-colors ${on ? "border-accent bg-card" : "border-line bg-surface hover:border-accent"} ${disabled && !on ? "pointer-events-none opacity-40" : ""}`}
          >
            <input
              type="radio"
              name={name}
              checked={on}
              disabled={disabled}
              onChange={() => onChange(key)}
              className="sr-only"
            />
            <Icon
              size={20}
              aria-hidden="true"
              className={`mt-0.5 shrink-0 ${on ? "text-accent-text" : "text-fg-muted"}`}
            />
            <span className="grid gap-0.5">
              <span className="font-medium">{title}</span>
              {hint && <span className="text-fg-muted">{hint}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}

/** New or existing promotion: the discount, how it applies, conditions and dates, with a preview. */
export function PromotionForm({
  promotion,
  locale,
  currency,
  t,
  onDone,
}: {
  promotion?: AdminPromotion;
  locale: Locale;
  currency: string;
  t: AdminText;
  /** What was saved, in words. */
  onDone: (message: string) => void;
}) {
  const text = t.promotions;
  const action = useAdminAction();
  const [kind, setKind] = useState<Kind>(promotion?.type ?? "percent");
  const [amount, setAmount] = useState(
    promotion
      ? promotion.type === "percent"
        ? String(promotion.value)
        : toMajor(promotion.value, currency)
      : "",
  );
  // A saved code can't be taken away (the API keeps it), so an existing promotion keeps its kind.
  const [how, setHow] = useState<How>(
    promotion ? (promotion.code ? "code" : "auto") : "code",
  );
  const [code, setCode] = useState(promotion?.code ?? "");
  const [name, setName] = useState(promotion?.name.es ?? "");
  const [firstVisit, setFirstVisit] = useState(
    promotion?.firstVisitOnly ?? false,
  );
  const [loyalty, setLoyalty] = useState(Boolean(promotion?.everyVisits));

  const minor = kind === "fixed" ? toMinor(amount, currency) : null;
  const percent = kind === "percent" ? Number(amount) : null;
  const shown =
    kind === "percent"
      ? percent && percent > 0
        ? `${percent} %`
        : "—"
      : minor !== null && minor > 0
        ? formatMoney(minor, currency, locale)
        : "—";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const max = value(form, "maxRedemptions");
    const every = value(form, "everyVisits");
    const startsAt = fromDateBox(value(form, "startsAt"));
    const endsAt = fromDateBox(value(form, "endsAt"), true);
    const body = {
      name: { ...(promotion?.name ?? {}), es: name.trim() },
      type: kind,
      value: kind === "percent" ? Math.round(percent ?? 0) : (minor ?? 0),
      firstVisitOnly: firstVisit,
      ...(how === "code" && code.trim() ? { code: code.trim() } : {}),
      ...(max ? { maxRedemptions: Number(max) } : {}),
      ...(loyalty && every
        ? { everyVisits: Number(every) }
        : promotion?.everyVisits
          ? { everyVisits: null }
          : {}),
      ...(startsAt ? { startsAt } : {}),
      ...(endsAt ? { endsAt } : {}),
    };
    action.mutate(
      {
        method: promotion ? "PATCH" : "POST",
        path: promotion ? `promotions/${promotion.id}` : "promotions",
        body,
      },
      {
        onSuccess: (result) =>
          result.ok &&
          onDone(
            (promotion ? text.saved : text.created).replace(
              "{what}",
              [
                name.trim(),
                shown,
                how === "code" ? code.trim().toUpperCase() : text.auto,
              ]
                .filter(Boolean)
                .join(" · "),
            ),
          ),
      },
    );
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"
    >
      <div className="grid min-w-0 gap-6">
        <FormSection title={text.sectionDiscount}>
          <Field
            name="name"
            label={t.common.nameEs}
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Choice
            name="type"
            value={kind}
            onChange={(next) => {
              setKind(next);
              setAmount("");
            }}
            options={[
              { key: "percent", title: text.percent, icon: BadgePercent },
              { key: "fixed", title: text.fixed, icon: Ticket },
            ]}
          />
          {kind === "percent" ? (
            <Field
              name="value"
              type="number"
              min={1}
              max={100}
              label={`${text.value} (%)`}
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          ) : (
            <PriceField
              currency={currency}
              locale={locale}
              label={text.value}
              {...(promotion && promotion.type === "fixed"
                ? { defaultValue: toMajor(promotion.value, currency) }
                : {})}
              onValue={setAmount}
            />
          )}
        </FormSection>

        <FormSection title={text.sectionHow}>
          <Choice
            name="how"
            value={how}
            onChange={setHow}
            disabled={Boolean(promotion)}
            options={[
              {
                key: "code",
                title: text.withCode,
                hint: text.withCodeHint,
                icon: Ticket,
              },
              { key: "auto", title: text.auto, hint: text.autoHint, icon: Zap },
            ]}
          />
          {how === "code" && (
            <Field
              name="code"
              label={text.code.split(" (")[0] ?? text.code}
              hint={text.codeHint}
              required
              minLength={3}
              maxLength={32}
              pattern="[A-Za-z0-9_\-]{3,32}"
              autoCapitalize="characters"
              autoComplete="off"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              className="font-mono"
            />
          )}
        </FormSection>

        <FormSection title={text.sectionConditions}>
          <Toggle
            label={text.firstVisitOnly}
            checked={firstVisit}
            onChange={setFirstVisit}
          />
          <Toggle
            label={text.loyalty}
            checked={loyalty}
            onChange={setLoyalty}
          />
          {loyalty && (
            <Field
              name="everyVisits"
              type="number"
              min={2}
              max={100}
              label={text.everyLabel}
              hint={text.loyaltyHint}
              required
              defaultValue={promotion?.everyVisits ?? 6}
            />
          )}
          <Field
            name="maxRedemptions"
            type="number"
            min={1}
            label={text.maxRedemptions.split(" (")[0] ?? text.maxRedemptions}
            hint={text.maxUsesHint}
            defaultValue={promotion?.maxRedemptions}
          />
        </FormSection>

        <FormSection title={text.sectionDates}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              name="startsAt"
              type="date"
              label={text.startsAt}
              defaultValue={dateBox(promotion?.startsAt)}
            />
            <Field
              name="endsAt"
              type="date"
              label={text.endsAt}
              defaultValue={dateBox(promotion?.endsAt)}
            />
          </div>
        </FormSection>

        {action.data && !action.data.ok && (
          <Result result={action.data} t={t.common} />
        )}
        <Button type="submit" disabled={action.isPending} className="sm:w-fit">
          {promotion ? t.common.save : text.newPromotion}
        </Button>
      </div>

      <aside className="grid content-start gap-2">
        <p className="text-sm font-medium text-fg-muted">{text.preview}</p>
        <div className="grid gap-3 rounded-3xl border border-accent bg-card p-5 text-center">
          <p className="text-3xl font-semibold text-accent-text tabular-nums">
            {shown}
          </p>
          <p className="font-medium">{name.trim() || t.services.untitled}</p>
          {how === "code" ? (
            <p className="mx-auto rounded-xl border border-dashed border-accent px-3 py-1.5 font-mono text-sm tracking-widest">
              {code.trim() || "······"}
            </p>
          ) : (
            <p className="inline-flex items-center justify-center gap-1 text-sm text-fg-muted">
              <Zap size={14} aria-hidden="true" />
              {text.autoHint}
            </p>
          )}
        </div>
      </aside>
    </form>
  );
}
