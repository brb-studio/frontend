"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarRange,
  Gift,
  Plus,
  Sparkles,
  Tag,
  Ticket,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import * as z from "zod";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { formatMoney } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import {
  ActiveSwitch,
  ChoicePills,
  EditButton,
  EntityCard,
  Fact,
  Notice,
} from "./admin-kit";
import { promoPhase, usesShare } from "./admin-view";
import { adminQuery, useAdminAction } from "./api";
import type { StatusFilter } from "./catalog-view";
import { PromotionForm } from "./promotion-form";
import { type AdminPromotion, promotionSchema } from "./schemas";
import { type AdminText, Panel, Result } from "./ui";

const promotionsQuery = adminQuery("promotions", z.array(promotionSchema));

export function PromotionsManager({
  locale,
  currency,
  t,
}: {
  locale: Locale;
  currency: string;
  t: AdminText;
}) {
  const text = t.promotions;
  const promotions = useQuery(promotionsQuery);
  const action = useAdminAction();
  const [editing, setEditing] = useState<AdminPromotion | "new" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("active");
  const amount = (p: AdminPromotion) =>
    p.type === "percent"
      ? `${p.value} %`
      : formatMoney(p.value, currency, locale);
  const day = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(
      new Date(iso),
    );
  const shown = (promotions.data ?? []).filter(
    (p) => status === "all" || p.active === (status === "active"),
  );
  const open = (next: AdminPromotion | "new") => {
    setNotice(null);
    setEditing(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="grid gap-5">
      <Notice
        message={notice}
        closeLabel={t.common.close}
        onClose={() => setNotice(null)}
      />
      {editing && (
        <Panel
          title={
            editing === "new"
              ? text.newPromotion
              : `${t.common.edit}: ${pick(editing.name, locale)}`
          }
          action={
            <Button variant="secondary" onClick={() => setEditing(null)}>
              <X size={18} aria-hidden="true" />
              {t.common.close}
            </Button>
          }
        >
          <PromotionForm
            key={editing === "new" ? "new" : editing.id}
            {...(editing === "new" ? {} : { promotion: editing })}
            locale={locale}
            currency={currency}
            t={t}
            onDone={(message) => {
              setEditing(null);
              setNotice(message);
            }}
          />
        </Panel>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ChoicePills
          name="status"
          label={t.common.active}
          value={status}
          options={[
            ["active", t.services.filterActive],
            ["inactive", t.services.filterInactive],
            ["all", t.services.filterAll],
          ]}
          onChange={setStatus}
        />
        <Button onClick={() => open("new")}>
          <Plus size={18} aria-hidden="true" />
          {text.newPromotion}
        </Button>
      </div>
      {action.data && !action.data.ok && (
        <Result result={action.data} t={t.common} />
      )}

      {promotions.isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : shown.length === 0 ? (
        <p className="text-fg-muted">{text.empty}</p>
      ) : (
        <ul className="grid gap-3">
          {shown.map((p) => {
            const phase = promoPhase(p);
            const share = usesShare(p.redemptions, p.maxRedemptions);
            const state =
              phase === "live"
                ? p.endsAt
                  ? text.until.replace("{date}", day(p.endsAt))
                  : text.live
                : phase === "scheduled" && p.startsAt
                  ? text.scheduled.replace("{date}", day(p.startsAt))
                  : phase === "ended"
                    ? text.ended
                    : text.inactive;
            return (
              <EntityCard
                key={p.id}
                icon={Tag}
                badge={amount(p)}
                title={pick(p.name, locale)}
                muted={!p.active || phase === "ended"}
                highlight={phase === "live"}
                aside={
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${phase === "live" ? "bg-accent text-accent-fg" : "border border-line text-fg-muted"}`}
                  >
                    {state}
                  </span>
                }
                actions={
                  <>
                    <ActiveSwitch
                      label={t.services.activeLabel}
                      checked={p.active}
                      disabled={action.isPending}
                      onChange={(active) =>
                        action.mutate({
                          method: "PATCH",
                          path: `promotions/${p.id}`,
                          body: { active },
                        })
                      }
                    />
                    <EditButton label={t.common.edit} onClick={() => open(p)} />
                  </>
                }
              >
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {p.code ? (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-dashed border-accent px-2 py-0.5 font-mono text-xs tracking-wider">
                      <Ticket size={12} aria-hidden="true" />
                      {p.code}
                    </span>
                  ) : (
                    <Fact icon={Zap}>{text.automatic}</Fact>
                  )}
                  {p.firstVisitOnly && (
                    <Fact icon={Sparkles}>{text.firstVisitOnly}</Fact>
                  )}
                  {p.everyVisits && (
                    <Fact icon={Gift}>
                      {text.everyVisitsShort.replace(
                        "{n}",
                        String(p.everyVisits),
                      )}
                    </Fact>
                  )}
                  {(p.startsAt || p.endsAt) && (
                    <Fact icon={CalendarRange}>
                      {[
                        p.startsAt && day(p.startsAt),
                        p.endsAt && day(p.endsAt),
                      ]
                        .filter(Boolean)
                        .join(" – ")}
                    </Fact>
                  )}
                </p>
                <div className="grid gap-1 pt-1">
                  <p className="text-fg-muted tabular-nums">
                    {p.maxRedemptions
                      ? text.usesOf
                          .replace("{n}", String(p.redemptions))
                          .replace("{max}", String(p.maxRedemptions))
                      : text.usesCount.replace("{n}", String(p.redemptions))}
                  </p>
                  {share !== null && (
                    <div
                      className="h-1.5 max-w-xs overflow-hidden rounded-full bg-line"
                      role="img"
                      aria-label={`${share} %`}
                    >
                      <div
                        className={`h-full rounded-full ${share >= 100 ? "bg-danger" : "bg-accent"}`}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  )}
                </div>
              </EntityCard>
            );
          })}
        </ul>
      )}
    </div>
  );
}
