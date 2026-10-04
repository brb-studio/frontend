"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarX } from "lucide-react";
import { useState } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { formatMoney } from "@/shared/i18n/money";
import { Button, ButtonLink } from "@/shared/ui/button";
import { FormAlert } from "@/shared/ui/form";
import { cancelAppointment } from "./actions";
import {
  type Appointment,
  myAppointmentsKey,
  myAppointmentsQuery,
} from "./model";

const when = (a: Appointment, locale: Locale) =>
  new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone: a.timeZone,
  }).format(new Date(a.startAt));

/** The customer's upcoming visits (cancellable while the branch's notice allows) and history. */
export function MyAppointments({
  locale,
  t,
}: {
  locale: Locale;
  t: Dictionary["account"];
}) {
  const queryClient = useQueryClient();
  const appointments = useQuery(myAppointmentsQuery());
  const [error, setError] = useState<"tooLate" | "unavailable" | null>(null);
  const cancelling = useMutation({
    mutationFn: cancelAppointment,
    onSuccess: (result) => {
      setError(result.ok ? null : result.error);
      void queryClient.invalidateQueries({ queryKey: myAppointmentsKey });
    },
  });

  if (appointments.isPending)
    return <p className="text-fg-muted">{t.loading}</p>;
  const list = appointments.data ?? [];
  const now = Date.now();
  const upcoming = list
    .filter((a) => a.status === "confirmed" && Date.parse(a.endAt) > now)
    .reverse();
  const history = list.filter((a) => !upcoming.includes(a));

  const row = (a: Appointment) => (
    <li
      key={a.id}
      className="grid gap-1 rounded-3xl border border-line bg-card px-4 py-3 text-sm"
    >
      <p className="flex justify-between gap-3 font-medium">
        <span className="first-letter:uppercase">{when(a, locale)}</span>
        <span className="shrink-0 text-fg-muted">{t.status[a.status]}</span>
      </p>
      <p>
        {a.items.map((item) => pick(item.name, locale)).join(" + ")} ·{" "}
        {a.barber?.name}
      </p>
      <p className="flex items-center justify-between gap-3 text-fg-muted">
        <span>
          {a.branch?.name} · {formatMoney(a.totalMinor, a.currency, locale)}
        </span>
        {a.cancellable && (
          <Button
            variant="secondary"
            onClick={() => cancelling.mutate(a.id)}
            disabled={cancelling.isPending}
          >
            <CalendarX size={16} aria-hidden="true" />
            {t.cancel}
          </Button>
        )}
      </p>
    </li>
  );

  return (
    <div className="grid gap-6">
      {error && <FormAlert>{t.cancelErrors[error]}</FormAlert>}
      <section aria-labelledby="upcoming-title" className="grid gap-3">
        <h2 id="upcoming-title" className="text-xl font-medium">
          {t.upcoming}
        </h2>
        {upcoming.length > 0 ? (
          <ul className="grid gap-2">{upcoming.map(row)}</ul>
        ) : (
          <div className="grid justify-items-start gap-3">
            <p className="text-fg-muted">{t.noAppointments}</p>
            <ButtonLink href={`/${locale}/services`}>{t.book}</ButtonLink>
          </div>
        )}
      </section>
      {history.length > 0 && (
        <section aria-labelledby="history-title" className="grid gap-3">
          <h2 id="history-title" className="text-xl font-medium">
            {t.history}
          </h2>
          <ul className="grid gap-2">{history.map(row)}</ul>
        </section>
      )}
    </div>
  );
}
