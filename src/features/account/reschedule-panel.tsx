"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { useMemo, useState } from "react";
import { toBookingOptions } from "@/features/booking/model";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { Button } from "@/shared/ui/button";
import { FormAlert } from "@/shared/ui/form";
import { rescheduleAppointment } from "./actions";
import {
  type Appointment,
  myAppointmentsKey,
  rescheduleSlotsKey,
  rescheduleSlotsQuery,
} from "./model";

const pill =
  "relative shrink-0 cursor-pointer snap-start rounded-full border border-line bg-card px-4 py-2.5 text-sm transition-colors duration-300 hover:border-accent-text has-checked:border-accent has-checked:bg-accent has-checked:text-accent-fg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-text";

export function ReschedulePanel({
  appointment,
  locale,
  t,
  onMoved,
}: {
  appointment: Appointment;
  locale: Locale;
  t: Dictionary["account"];
  onMoved: () => void;
}) {
  const queryClient = useQueryClient();
  const slots = useQuery(rescheduleSlotsQuery(appointment.id));
  const options = useMemo(
    () => slots.data && toBookingOptions(slots.data, locale),
    [slots.data, locale],
  );
  const barber = options?.barbers[0];
  const [date, setDate] = useState("");
  const [startAt, setStartAt] = useState("");
  const day = barber?.days.find((d) => d.date === date) ?? barber?.days[0];
  const slot = day?.times.find((x) => x.value === startAt);
  const isCurrent = startAt === appointment.startAt;

  const dayLabel = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: slots.data?.branch.timeZone,
    }).format(new Date(`${value}T12:00:00Z`));

  const move = useMutation({
    mutationFn: (value: string) => rescheduleAppointment(appointment.id, value),
    onSuccess: (result) => {
      if (!result.ok) return;
      void queryClient.invalidateQueries({ queryKey: myAppointmentsKey });
      void queryClient.invalidateQueries({
        queryKey: rescheduleSlotsKey(appointment.id),
      });
      onMoved();
    },
  });
  const failure = move.data && !move.data.ok ? move.data : null;

  return (
    <div className="grid gap-4 rounded-3xl border border-line bg-card px-4 py-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        <CalendarClock
          size={18}
          aria-hidden="true"
          className="text-accent-text"
        />
        {t.pickNewTime} · {barber?.name ?? appointment.barber?.name}
      </p>
      {slots.isPending ? (
        <p className="text-sm text-fg-muted">{t.loading}</p>
      ) : slots.isError || !barber || !day ? (
        <div className="grid gap-3">
          <FormAlert>{t.rescheduleErrors.unavailable}</FormAlert>
          <Button variant="secondary" onClick={() => void slots.refetch()}>
            {t.retry}
          </Button>
        </div>
      ) : (
        <>
          <fieldset>
            <legend className="sr-only">{t.pickNewTime}</legend>
            <div className="-mx-4 flex snap-x gap-2 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
              {barber.days.map((d) => (
                <label key={d.date} className={pill}>
                  <input
                    type="radio"
                    name={`day-${appointment.id}`}
                    value={d.date}
                    checked={d.date === day.date}
                    onChange={() => {
                      setDate(d.date);
                      setStartAt("");
                    }}
                    className="sr-only"
                  />
                  {dayLabel(d.date)}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="-mx-4 flex snap-x gap-2 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
            {day.times.map((x) => (
              <label key={x.value} className={pill}>
                <input
                  type="radio"
                  name={`time-${appointment.id}`}
                  value={x.value}
                  checked={x.value === slot?.value}
                  onChange={() => setStartAt(x.value)}
                  className="sr-only"
                />
                {x.label}
                {x.value === appointment.startAt && (
                  <span className="text-xs opacity-70"> · {t.currentSlot}</span>
                )}
              </label>
            ))}
          </div>
          {failure && (
            <FormAlert>{t.rescheduleErrors[failure.error]}</FormAlert>
          )}
          <div className="flex items-center justify-between gap-3">
            <p aria-live="polite" className="text-sm text-fg-muted">
              {slot ? `${day.long} · ${slot.label} – ${slot.end}` : t.loading}
            </p>
            <Button
              disabled={!slot || isCurrent || move.isPending}
              onClick={() => slot && void move.mutate(slot.value)}
            >
              {t.confirmMove}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
