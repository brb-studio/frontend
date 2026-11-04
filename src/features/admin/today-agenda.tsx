"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { type AgendaGroup, groupAgenda, todayIn } from "./agenda-groups";
import { dayQuery } from "./agenda-manager";
import { Fold } from "./fold";
import type { AdminAppointment } from "./schemas";
import type { AdminText } from "./ui";

/** Upcoming visits shown per branch; the rest is one tap away in Agenda. */
const SHOWN = 5;

type Props = {
  locale: Locale;
  t: AdminText;
  status: Dictionary["account"]["status"];
  /** The shop's time zone: "today" is its date, not the browser's. */
  timeZone: string | undefined;
};

/** Home for owner, admin and manager: today's appointments by branch, what's left to do first. */
export function TodayAgenda({ locale, t, status, timeZone }: Props) {
  const day = todayIn(timeZone);
  const agenda = useQuery(dayQuery(day));
  const groups = groupAgenda(agenda.data ?? []);
  const text = t.home;

  return (
    <section aria-labelledby="today-agenda" className="grid gap-3">
      <h2 id="today-agenda" className="text-xl font-medium">
        {text.agendaTitle}
      </h2>
      {agenda.isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : groups.length === 0 ? (
        <p className="text-fg-muted">{text.empty}</p>
      ) : (
        groups.map((group) => (
          <BranchDay
            key={group.branchId}
            group={group}
            href={`/${locale}/admin/agenda?branch=${group.branchId}&date=${day}`}
            locale={locale}
            t={t}
            status={status}
          />
        ))
      )}
    </section>
  );
}

function BranchDay({
  group,
  href,
  locale,
  t,
  status,
}: {
  group: AgendaGroup<AdminAppointment>;
  href: string;
  locale: Locale;
  t: AdminText;
  status: Props["status"];
}) {
  const text = t.home;
  const hidden = group.open.length - SHOWN;
  const line = (a: AdminAppointment) => (
    <AgendaLine key={a.id} a={a} locale={locale} t={t} status={status} />
  );
  return (
    <article className="grid gap-3 rounded-[1.75rem] border border-line bg-card p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-medium">
          {group.branchName}
          <span className="ml-2 text-sm font-normal text-fg-muted">
            {text.toAttend.replace("{n}", String(group.open.length))}
          </span>
        </h3>
        <Link
          href={href}
          className="inline-flex min-h-11 items-center text-sm text-accent-text underline-offset-2 hover:underline"
        >
          {text.seeAll}
        </Link>
      </header>
      {group.open.length > 0 ? (
        <ul className="grid gap-2">{group.open.slice(0, SHOWN).map(line)}</ul>
      ) : (
        <p className="text-sm text-fg-muted">{text.nothingLeft}</p>
      )}
      {hidden > 0 && (
        <Link
          href={href}
          className="inline-flex min-h-11 items-center text-sm text-accent-text underline-offset-2 hover:underline"
        >
          {text.more.replace("{n}", String(hidden))}
        </Link>
      )}
      <Fold title={t.agenda.attended} count={group.done.length}>
        {group.done.map(line)}
      </Fold>
      <Fold title={t.agenda.closedGroup} count={group.closed.length}>
        {group.closed.map(line)}
      </Fold>
    </article>
  );
}

function AgendaLine({
  a,
  locale,
  t,
  status,
}: {
  a: AdminAppointment;
  locale: Locale;
  t: AdminText;
  status: Props["status"];
}) {
  const time = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: a.timeZone,
  }).format(new Date(a.startAt));
  const toClose =
    a.status === "confirmed" && Date.parse(a.startAt) <= Date.now();
  const label = toClose
    ? t.agenda.toClose
    : a.status === "confirmed"
      ? null
      : status[a.status];
  const quiet = a.status === "cancelled" || a.status === "no_show";
  return (
    <li
      className={`grid gap-0.5 rounded-2xl border px-4 py-2.5 text-sm ${toClose ? "border-accent" : "border-line"} ${quiet ? "opacity-60" : ""}`}
    >
      <p className="flex justify-between gap-3 font-medium">
        <span>
          {time} · {a.customer?.name}
        </span>
        {label && (
          <span
            className={`shrink-0 ${toClose ? "text-accent-text" : "text-fg-muted"}`}
          >
            {label}
          </span>
        )}
      </p>
      <p className="text-fg-muted">
        {[
          a.items.map((item) => pick(item.name, locale)).join(" + "),
          a.barber?.name,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </li>
  );
}
