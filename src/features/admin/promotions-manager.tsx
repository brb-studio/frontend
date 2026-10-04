"use client";

import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import * as z from "zod";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { formatMoney, toMinor } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Select } from "@/shared/ui/select";
import { adminQuery, useAdminAction } from "./api";
import { type AdminPromotion, promotionSchema } from "./schemas";
import {
  type AdminText,
  Panel,
  Result,
  Row,
  smallButton,
  Toggle,
  value,
} from "./ui";

const promotionsQuery = adminQuery("promotions", z.array(promotionSchema));

/** Discounts: a code or automatic, percentage or fixed, with optional first-visit and usage limits. */
export function PromotionsManager({
  locale,
  currency,
  t,
}: {
  locale: Locale;
  currency: string;
  t: AdminText;
}) {
  const promotions = useQuery(promotionsQuery);
  const create = useAdminAction();
  const toggle = useAdminAction();
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [firstVisit, setFirstVisit] = useState(false);

  const amount = (p: AdminPromotion) =>
    p.type === "percent"
      ? `${p.value}%`
      : formatMoney(p.value, currency, locale);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = value(form, "code");
    const max = value(form, "maxRedemptions");
    const raw = value(form, "value");
    create.mutate(
      {
        method: "POST",
        path: "promotions",
        body: {
          name: { es: value(form, "name") },
          type,
          value:
            type === "percent" ? Number(raw) : (toMinor(raw, currency) ?? 0),
          firstVisitOnly: firstVisit,
          ...(code ? { code } : {}),
          ...(max ? { maxRedemptions: Number(max) } : {}),
        },
      },
      { onSuccess: (result) => result.ok && setAdding(false) },
    );
  }

  return (
    <Panel
      title={t.nav.promotions}
      action={
        <button
          type="button"
          className={smallButton}
          onClick={() => setAdding(!adding)}
        >
          {adding ? t.common.close : t.promotions.newPromotion}
        </button>
      }
    >
      {adding && (
        <form onSubmit={submit} className="grid gap-3">
          <Field name="name" label={t.common.nameEs} required />
          <Field
            name="code"
            label={t.promotions.code}
            autoCapitalize="characters"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              name="type"
              label={t.promotions.type}
              value={type}
              onChange={(event) =>
                setType(event.target.value === "fixed" ? "fixed" : "percent")
              }
            >
              <option value="percent">{t.promotions.percent}</option>
              <option value="fixed">{t.promotions.fixed}</option>
            </Select>
            <Field
              name="value"
              inputMode="decimal"
              label={`${t.promotions.value}${type === "percent" ? " (%)" : ""}`}
              required
            />
          </div>
          <Field
            name="maxRedemptions"
            type="number"
            min={1}
            label={t.promotions.maxRedemptions}
          />
          <Toggle
            label={t.promotions.firstVisitOnly}
            checked={firstVisit}
            onChange={setFirstVisit}
          />
          <Result result={create.data} t={t.common} />
          <Button type="submit" disabled={create.isPending}>
            {t.promotions.newPromotion}
          </Button>
        </form>
      )}
      <Result result={toggle.data} t={t.common} />
      {promotions.isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : promotions.data && promotions.data.length > 0 ? (
        <ul className="grid gap-2">
          {promotions.data.map((p) => (
            <Row
              key={p.id}
              muted={!p.active}
              title={`${pick(p.name, locale)} · ${amount(p)}`}
              meta={[
                p.code ?? t.promotions.automatic,
                p.firstVisitOnly ? t.promotions.firstVisitOnly : "",
                `${p.redemptions}${p.maxRedemptions ? `/${p.maxRedemptions}` : ""} ${t.promotions.uses}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            >
              <button
                type="button"
                className={smallButton}
                disabled={toggle.isPending}
                onClick={() =>
                  toggle.mutate({
                    method: "PATCH",
                    path: `promotions/${p.id}`,
                    body: { active: !p.active },
                  })
                }
              >
                {p.active ? t.common.deactivate : t.common.activate}
              </button>
            </Row>
          ))}
        </ul>
      ) : (
        <p className="text-fg-muted">{t.common.empty}</p>
      )}
    </Panel>
  );
}
