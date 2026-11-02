"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import * as z from "zod";
import { availabilitySchema } from "@/features/booking/model";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { adminQuery, useAdminAction } from "./api";
import type { AdminAppointment } from "./schemas";
import { type AdminText, pill, Result } from "./ui";

const slotsSchema = availabilitySchema.extend({
  barbers: z.array(
    availabilitySchema.shape.barbers.element.extend({ id: z.string() }),
  ),
});

export const localDateOf = (at: string, timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(at));

export function RescheduleForm({
  appointment,
  t,
  onMoved,
}: {
  appointment: AdminAppointment;
  t: AdminText;
  onMoved: (date: string) => void;
}) {
  const [date, setDate] = useState(() =>
    localDateOf(appointment.startAt, appointment.timeZone),
  );
  const [slot, setSlot] = useState("");
  const move = useAdminAction();
  const free = useQuery({
    ...adminQuery(
      `appointments/${appointment.id}/slots?from=${date}&days=1`,
      slotsSchema,
    ),
    enabled: date !== "",
  });
  const times = (free.data?.barbers ?? [])
    .map((barber) => ({
      barber,
      slots: barber.days.find((d) => d.date === date)?.slots ?? [],
    }))
    .filter((row) => row.slots.length > 0);
  const isCurrent = (barberId: string, startAt: string) =>
    barberId === appointment.barberId &&
    Date.parse(startAt) === Date.parse(appointment.startAt);

  function submit() {
    const [barberId, startAt] = slot.split("|");
    if (!barberId || !startAt) return;
    move.mutate(
      {
        method: "PATCH",
        path: `appointments/${appointment.id}`,
        body: {
          startAt,
          ...(barberId !== appointment.barberId && { barberId }),
        },
      },
      {
        onSuccess: (result) => {
          if (result.ok) onMoved(date);
        },
      },
    );
  }

  return (
    <div className="grid w-full gap-3 rounded-2xl border border-line bg-card p-4">
      <Field
        name="date"
        type="date"
        label={t.agenda.day}
        value={date}
        required
        onChange={(event) => {
          setDate(event.target.value);
          setSlot("");
        }}
      />
      <div className="grid gap-3" aria-live="polite">
        {free.isPending ? (
          <p className="text-sm text-fg-muted">{t.common.loading}</p>
        ) : times.length === 0 ? (
          <p className="text-sm text-fg-muted">{t.agenda.noTimes}</p>
        ) : (
          times.map(({ barber, slots }) => (
            <fieldset key={barber.id} className="min-w-0">
              <legend className="mb-2 text-sm font-medium">
                {barber.name}
              </legend>
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => {
                  const id = `${barber.id}|${s.startAt}`;
                  return (
                    <label key={id} className={pill}>
                      <input
                        type="radio"
                        name={`move-${appointment.id}`}
                        value={id}
                        checked={slot === id}
                        onChange={() => setSlot(id)}
                        className="sr-only"
                      />
                      {s.time}
                      {isCurrent(barber.id, s.startAt) && (
                        <span className="text-xs opacity-70">
                          {" "}
                          · {t.agenda.currentSlot}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))
        )}
      </div>
      <Result result={move.data} t={t.common} />
      <Button
        type="button"
        disabled={
          move.isPending ||
          !slot ||
          isCurrent(slot.split("|")[0] ?? "", slot.split("|")[1] ?? "")
        }
        onClick={submit}
      >
        {t.agenda.confirmMove}
      </Button>
    </div>
  );
}
