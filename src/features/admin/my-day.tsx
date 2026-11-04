"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, ChevronDown } from "lucide-react";
import Link from "next/link";
import * as z from "zod";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { ButtonLink } from "@/shared/ui/button";
import { adminQuery } from "./api";
import { BecomeBarber } from "./become-barber";
import { staffAppointmentSchema } from "./schemas";
import { phaseOf, shopClock, splitMyDay } from "./visit-phase";

const myDayQuery = adminQuery(
  "appointments/my-day",
  z.object({
    barber: z.object({ id: z.string(), name: z.string() }).nullable(),
    timeZone: z.string().optional(),
    appointments: z.array(staffAppointmentSchema).default([]),
  }),
);

const hour = (at: string, timeZone: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(at));

/** The signed-in person's own cuts for today: how many, at what time, for whom. Refreshes with every live notification. */
export function MyDay({
  locale,
  t,
  status,
  me,
  canBecome,
}: {
  locale: Locale;
  t: Dictionary["admin"];
  status: Dictionary["account"]["status"];
  me: string;
  canBecome: boolean;
}) {
  const { data, isPending } = useQuery(myDayQuery);
  if (isPending) return <p className="text-fg-muted">{t.common.loading}</p>;
  if (!data?.barber && canBecome) return <BecomeBarber t={t} me={me} />;
  if (!data?.barber) {
    return (
      <section className="grid gap-3 rounded-[1.75rem] border border-line bg-card p-5">
        <p className="font-medium">{t.myDay.noProfile}</p>
        <p className="text-sm text-fg-muted">{t.myDay.noProfileHint}</p>
        <ButtonLink href={`/${locale}/admin/barbers`} variant="secondary">
          {t.myDay.goBarbers}
        </ButtonLink>
      </section>
    );
  }
  const { appointments, timeZone = "UTC" } = data;
  const now = Date.now();
  const { current, next, active, done } = splitMyDay(appointments, now);
  const clock = shopClock(timeZone, locale);
  const total =
    appointments.length === 1
      ? t.myDay.one
      : t.myDay.other.replace("{n}", String(appointments.length));

  const row = (a: (typeof appointments)[number]) => {
    const phase = phaseOf(a, now);
    const badge =
      a.id === current?.id
        ? t.myDay.inProgress
        : a.id === next?.id
          ? t.myDay.next
          : null;
    return (
      <li
        key={a.id}
        className={`grid gap-1 rounded-3xl border bg-card px-4 py-3 text-sm ${badge ? "border-accent" : "border-line"} ${phase === "closed" ? "opacity-60" : ""}`}
      >
        <p className="flex justify-between gap-3 font-medium">
          <span>
            {hour(a.startAt, timeZone, locale)}
            {badge && (
              <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-fg">
                {badge}
              </span>
            )}
          </span>
          <span
            className={
              phase === "toClose" ? "text-accent-text" : "text-fg-muted"
            }
          >
            {phase === "toClose" ? t.agenda.toClose : status[a.status]}
          </span>
        </p>
        <p>
          {a.customer?.name} ·{" "}
          {a.items.map((item) => pick(item.name, locale)).join(" + ")}
        </p>
        {a.customer?.phone && (
          <Link
            href={`tel:${a.customer.phone}`}
            className="inline-flex min-h-11 w-fit items-center text-fg-muted underline-offset-2 hover:underline"
          >
            {a.customer.phone}
          </Link>
        )}
      </li>
    );
  };

  return (
    <section aria-labelledby="my-day-count" className="grid gap-3">
      <div className="grid gap-1">
        <p
          id="my-day-count"
          className="flex items-center gap-2 text-xl font-medium"
        >
          <CalendarCheck size={22} aria-hidden="true" className="text-accent" />
          {appointments.length > 0 ? total : t.myDay.empty}
        </p>
        {clock && (
          <p className="text-sm text-fg-muted">
            {t.myDay.shopTime.replace("{time}", clock)}
          </p>
        )}
      </div>
      <ul className="grid gap-2">{active.map(row)}</ul>
      {done.length > 0 && (
        <details className="group grid gap-2">
          <summary className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 text-sm text-fg-muted [&::-webkit-details-marker]:hidden">
            <ChevronDown
              size={16}
              aria-hidden="true"
              className="transition-transform group-open:rotate-180"
            />
            {t.myDay.finished.replace("{n}", String(done.length))}
          </summary>
          <ul className="mt-2 grid gap-2">{done.map(row)}</ul>
        </details>
      )}
    </section>
  );
}
