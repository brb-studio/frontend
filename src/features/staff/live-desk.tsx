"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import type { Appointment } from "@/features/account/model";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/select";
import { markAllRead } from "./actions";
import {
  agendaKey,
  agendaQuery,
  notificationSchema,
  notificationsKey,
  notificationsQuery,
  PAGE_SIZES,
  type StaffNotification,
} from "./model";

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

const localStart = (start: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${start}:00Z`));

const pageButton =
  "grid size-10 place-items-center rounded-full border text-sm font-medium tabular-nums transition-colors disabled:pointer-events-none disabled:opacity-40";

export function LiveDesk({
  locale,
  t,
  showAgenda = true,
}: {
  locale: Locale;
  t: Dictionary["account"];
  showAgenda?: boolean;
}) {
  const queryClient = useQueryClient();
  const agenda = useQuery(agendaQuery());
  const [live, setLive] = useState(false);
  const [latest, setLatest] = useState<StaffNotification | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const feed = useQuery(notificationsQuery(page, pageSize));
  const total = feed.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const reading = useMutation({
    mutationFn: markAllRead,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });

  useEffect(() => {
    if (feed.data && page > pages) setPage(pages);
  }, [feed.data, page, pages]);

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
      <section
        aria-labelledby="agenda-title"
        className={showAgenda ? "grid gap-3" : "hidden"}
      >
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
        <div className="flex flex-wrap items-center justify-between gap-3">
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
          <>
            <ul className="grid gap-2">
              {feed.data.items.map((n) => (
                <li
                  key={n.id}
                  className={`grid gap-0.5 rounded-2xl border bg-card px-4 py-2.5 text-sm ${n.read ? "border-line" : "border-accent"}`}
                >
                  <p className="flex flex-wrap justify-between gap-x-3 font-medium">
                    <span>{t.notificationTypes[n.type]}</span>
                    <span className="shrink-0 text-xs text-fg-muted">
                      {localStart(n.summary.start, locale)}
                    </span>
                  </p>
                  <p className="line-clamp-2 text-fg-muted">
                    {n.summary.customerName} ·{" "}
                    {items(n.summary.items.map((name) => ({ name })))} ·{" "}
                    {n.summary.branchName}
                  </p>
                </li>
              ))}
            </ul>
            <div className="grid gap-3 sm:grid-cols-[12rem_1fr] sm:items-end">
              <Select
                label={t.perPage}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </Select>
              <nav
                aria-label={t.notificationsTitle}
                className="grid justify-items-center gap-2 sm:justify-items-end"
              >
                <p className="text-xs text-fg-muted">
                  {t.pageRange
                    .replace("{from}", String((page - 1) * pageSize + 1))
                    .replace(
                      "{to}",
                      String((page - 1) * pageSize + feed.data.items.length),
                    )
                    .replace("{total}", String(total))}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className={`${pageButton} border-line`}
                    aria-label={t.previousPage}
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft size={18} aria-hidden="true" />
                  </button>
                  {Array.from({ length: pages }, (_, i) => i + 1)
                    .filter((n) => Math.abs(n - page) <= 2)
                    .map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-label={t.goToPage.replace("{n}", String(n))}
                        aria-current={n === page ? "page" : undefined}
                        className={`${pageButton} ${n === page ? "border-accent bg-accent text-accent-fg" : "border-line"} ${Math.abs(n - page) > 1 ? "hidden sm:grid" : ""}`}
                        onClick={() => setPage(n)}
                      >
                        {n}
                      </button>
                    ))}
                  <button
                    type="button"
                    className={`${pageButton} border-line`}
                    aria-label={t.nextPage}
                    disabled={page >= pages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                </div>
              </nav>
            </div>
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
