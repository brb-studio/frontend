"use client";

import { useQuery } from "@tanstack/react-query";
import { notificationsQuery } from "@/features/staff/model";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { dayQuery, today } from "./agenda-manager";
import type { AdminText } from "./ui";

/** Four numbers for the start of the day; they refresh when a booking lands (the live desk invalidates them). */
export function TodayStats({
  locale,
  currency,
  t,
}: {
  locale: Locale;
  currency: string;
  t: AdminText["home"];
}) {
  const appointments = useQuery(dayQuery(today()));
  const feed = useQuery(notificationsQuery());
  const day = (appointments.data ?? []).filter(
    (a) => a.status === "confirmed" || a.status === "completed",
  );
  const now = Date.now();
  const next = day
    .filter((a) => a.status === "confirmed" && Date.parse(a.endAt) > now)
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))[0];
  const time = (at: string, timeZone: string) =>
    new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).format(new Date(at));
  const pending = appointments.isPending ? "…" : undefined;

  const cards = [
    { label: t.today, value: pending ?? String(day.length) },
    {
      label: t.next,
      value: pending ?? (next ? time(next.startAt, next.timeZone) : t.noneLeft),
      detail: next?.customer?.name,
    },
    {
      label: t.expected,
      value:
        pending ??
        formatMoney(
          day.reduce((sum, a) => sum + a.totalMinor, 0),
          currency,
          locale,
        ),
    },
    {
      label: t.unread,
      value: feed.isPending ? "…" : String(feed.data?.unread ?? 0),
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="grid content-start gap-1 rounded-3xl border border-line bg-card p-4"
        >
          <dt className="text-sm text-fg-muted">{card.label}</dt>
          <dd className="text-2xl font-medium tabular-nums">{card.value}</dd>
          {card.detail && (
            <dd className="truncate text-sm text-fg-muted">{card.detail}</dd>
          )}
        </div>
      ))}
    </dl>
  );
}
