"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { Button } from "@/shared/ui/button";
import { markAllRead } from "./actions";
import {
  notificationSchema,
  notificationsKey,
  notificationsQuery,
  type StaffNotification,
} from "./model";
import { byNoticeDay, noticeAgo } from "./notice-time";

/** Notices shown first, added per "show more", and the most the API returns in one page. */
const FIRST = 5;
const STEP = 10;
const MAX = 50;

/** The appointment's local start ("YYYY-MM-DDTHH:MM", already in the branch's zone). */
const localStart = (start: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${start}:00Z`));

/** The current time, ticking every minute so "5 min ago" stays true. */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/** Live notices for the staff, newest first, grouped by the day they arrived. */
export function LiveDesk({
  locale,
  t,
}: {
  locale: Locale;
  t: Dictionary["account"];
}) {
  const queryClient = useQueryClient();
  const now = useNow();
  const [live, setLive] = useState(false);
  const [latest, setLatest] = useState<StaffNotification | null>(null);
  const [shown, setShown] = useState(FIRST);
  const feed = useQuery(notificationsQuery(1, shown));
  const items = feed.data?.items ?? [];
  const more = items.length < Math.min(feed.data?.total ?? 0, MAX);
  const reading = useMutation({
    mutationFn: markAllRead,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });

  useEffect(() => {
    const source = new EventSource("/api/staff/notifications/stream");
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKey });
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

  const names = (list: Parameters<typeof pick>[0][]) =>
    list.map((name) => pick(name, locale)).join(" + ");

  return (
    <div className="grid gap-8">
      <p aria-live="polite" className="sr-only">
        {latest
          ? `${t.notificationTypes[latest.type]}: ${latest.summary.customerName}`
          : ""}
      </p>
      <section aria-labelledby="notifications-title" className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="notifications-title" className="text-xl font-medium">
            {t.notificationsTitle}
            {feed.data && feed.data.unread > 0 && (
              <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-fg">
                {feed.data.unread}
              </span>
            )}
          </h2>
          {live && (
            <span className="flex items-center gap-1.5 text-xs text-accent-text">
              <Radio size={14} aria-hidden="true" />
              {t.live}
            </span>
          )}
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
        {items.length > 0 ? (
          <>
            {byNoticeDay(items, now).map((group) => (
              <div key={group.day} className="grid gap-2">
                <h3 className="text-sm font-medium text-fg-muted">
                  {t.noticeDays[group.day]}
                </h3>
                <ul className="grid gap-2">
                  {group.items.map((n) => (
                    <li
                      key={n.id}
                      className={`grid gap-0.5 rounded-2xl border bg-card px-4 py-2.5 text-sm ${n.read ? "border-line" : "border-accent"}`}
                    >
                      <p className="flex flex-wrap justify-between gap-x-3 font-medium">
                        <span>{t.notificationTypes[n.type]}</span>
                        <time
                          dateTime={n.createdAt}
                          className="shrink-0 text-xs font-normal text-fg-muted"
                        >
                          {noticeAgo(
                            n.createdAt,
                            n.summary.timeZone,
                            locale,
                            t.ago,
                            now,
                          )}
                        </time>
                      </p>
                      <p>
                        {t.appointmentAt.replace(
                          "{when}",
                          localStart(n.summary.start, locale),
                        )}
                      </p>
                      <p className="line-clamp-2 text-fg-muted">
                        {[
                          n.summary.customerName,
                          names(n.summary.items),
                          n.summary.barberName,
                          n.summary.branchName,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {more && (
              <Button
                variant="secondary"
                onClick={() => setShown((n) => Math.min(n + STEP, MAX))}
                disabled={feed.isFetching}
              >
                {t.loadMore}
              </Button>
            )}
          </>
        ) : (
          <p className="text-fg-muted">
            {feed.isPending ? t.loading : t.noNotifications}
          </p>
        )}
      </section>
    </div>
  );
}
