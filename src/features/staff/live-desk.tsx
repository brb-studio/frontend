"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { useEffect, useState } from "react";
import type { Appointment } from "@/features/account/model";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { Button } from "@/shared/ui/button";
import { markAllRead } from "./actions";
import {
  agendaKey,
  agendaQuery,
  notificationSchema,
  notificationsKey,
  notificationsQuery,
  type StaffNotification,
} from "./model";

/** "sáb 10 oct, 11:00" in the appointment's own timezone. */
export function when(at: string, timeZone: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(at));
}

/** A notification's local start ("2026-10-10T11:00") formatted without shifting it. */
const localStart = (start: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${start}:00Z`));

/**
 * A barber's live desk: the next 7 days, notifications, and a Server-Sent Events connection that
 * refreshes both the moment a booking lands. The browser reconnects on its own if the line drops.
 */
export function LiveDesk({
  locale,
  t,
}: {
  locale: Locale;
  t: Dictionary["account"];
}) {
  const queryClient = useQueryClient();
  const agenda = useQuery(agendaQuery());
  const feed = useQuery(notificationsQuery());
  const [live, setLive] = useState(false);
  const [latest, setLatest] = useState<StaffNotification | null>(null);
  const reading = useMutation({
    mutationFn: markAllRead,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });

  useEffect(() => {
    const source = new EventSource("/api/staff/notifications/stream");
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKey });
      void queryClient.invalidateQueries({ queryKey: agendaKey });
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    };
    source.addEventListener("ready", () => {
      setLive(true);
      refresh();
    });
    source.addEventListener("notification", (event) => {
      const parsed = notificationSchema.safeParse(JSON.parse(event.data));
      if (parsed.success) setLatest(parsed.data);
      refresh();
    });
    source.onerror = () => setLive(false);
    return () => source.close();
  }, [queryClient]);

  const items = (list: { name: Parameters<typeof pick>[0] }[]) =>
    list.map((item) => pick(item.name, locale)).join(" + ");

  return (
    <div className="grid gap-8">
      <p aria-live="polite" className="sr-only">
        {latest
          ? `${t.notificationTypes[latest.type]}: ${latest.summary.customerName}`
          : ""}
      </p>

      <section aria-labelledby="agenda-title" className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="agenda-title" className="text-xl font-medium">
            {t.agendaTitle}
          </h2>
          {live && (
            <span className="flex items-center gap-1.5 text-xs text-accent-text">
              <Radio size={14} aria-hidden="true" />
              {t.live}
            </span>
          )}
        </div>
        {agenda.isPending ? (
          <p className="text-fg-muted">{t.loading}</p>
        ) : agenda.data && agenda.data.length > 0 ? (
          <ul className="grid gap-2">
            {agenda.data.map((a: Appointment) => (
              <li
                key={a.id}
                className={`grid gap-1 rounded-3xl border border-line bg-card px-4 py-3 text-sm ${a.status === "cancelled" ? "opacity-60" : ""}`}
              >
                <p className="flex justify-between gap-3 font-medium">
                  <span>{when(a.startAt, a.timeZone, locale)}</span>
                  <span className="text-fg-muted">{t.status[a.status]}</span>
                </p>
                <p>
                  {a.customer?.name} · {items(a.items)}
                </p>
                <p className="text-fg-muted">
                  {a.barber?.name} · {a.branch?.name}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-fg-muted">{t.noAgenda}</p>
        )}
      </section>

      <section aria-labelledby="notifications-title" className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="notifications-title" className="text-xl font-medium">
            {t.notificationsTitle}
            {feed.data && feed.data.unread > 0 && (
              <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-fg">
                {feed.data.unread}
              </span>
            )}
          </h2>
          {feed.data && feed.data.unread > 0 && (
            <Button
              variant="secondary"
              onClick={() => reading.mutate()}
              disabled={reading.isPending}
            >
              {t.markRead}
            </Button>
          )}
        </div>
        {feed.data && feed.data.items.length > 0 ? (
          <ul className="grid gap-2">
            {feed.data.items.map((n) => (
              <li
                key={n.id}
                className={`grid gap-1 rounded-3xl border bg-card px-4 py-3 text-sm ${n.read ? "border-line" : "border-accent"}`}
              >
                <p className="font-medium">{t.notificationTypes[n.type]}</p>
                <p>
                  {n.summary.customerName} ·{" "}
                  {items(n.summary.items.map((name) => ({ name })))}
                </p>
                <p className="text-fg-muted">
                  {localStart(n.summary.start, locale)} · {n.summary.branchName}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-fg-muted">
            {feed.isPending ? t.loading : t.noNotifications}
          </p>
        )}
      </section>
    </div>
  );
}
