import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import type { CommissionView } from "./model";
import { type PlatformText, StatusBadge } from "./ui";

export const formatWhen = (iso: string, timeZone: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(iso));

export const formatDay = (iso: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(iso),
  );

/** 4000 → "40%", 1250 → "12.5%". */
export const formatBps = (bps: number, locale: Locale) =>
  new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(bps / 10_000);

export const money = (minor: number, currency: string, locale: Locale) =>
  currency ? formatMoney(minor, currency, locale) : String(minor);

export function CommissionBadge({
  view,
  t,
}: {
  view: CommissionView;
  t: PlatformText["commissionState"];
}) {
  const tone = {
    not_applicable: "muted",
    unconfigured: "bad",
    accrued: "warn",
    paid: "ok",
  } as const;
  return <StatusBadge tone={tone[view.state]}>{t[view.state]}</StatusBadge>;
}
