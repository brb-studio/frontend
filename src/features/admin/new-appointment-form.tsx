"use client";

import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import * as z from "zod";
import { availabilitySchema } from "@/features/booking/model";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Select } from "@/shared/ui/select";
import { adminQuery, useAdminAction } from "./api";
import { branchSchema, packageSchema, serviceSchema } from "./schemas";
import { type AdminText, pill, Result, value } from "./ui";

const branchesQuery = adminQuery("branches", z.array(branchSchema));
const servicesQuery = adminQuery("services", z.array(serviceSchema));
const packagesQuery = adminQuery("packages", z.array(packageSchema));
const staffAvailability = availabilitySchema.extend({
  barbers: z.array(
    availabilitySchema.shape.barbers.element.extend({ id: z.string() }),
  ),
});

/**
 * Walk-ins and phone bookings: what, when (free times from the same engine as online booking, without
 * the online notice and window limits) and who. The API re-checks the slot, so a race answers SLOT_TAKEN.
 */
export function NewAppointmentForm({
  locale,
  t,
  day,
  onBooked,
}: {
  locale: Locale;
  t: AdminText;
  day: string;
  onBooked: (date: string) => void;
}) {
  const branches = useQuery(branchesQuery);
  const services = useQuery(servicesQuery);
  const packages = useQuery(packagesQuery);
  const [branchId, setBranchId] = useState("");
  const [what, setWhat] = useState("");
  const [date, setDate] = useState(day);
  const [slot, setSlot] = useState("");
  const book = useAdminAction();

  const branch =
    branches.data?.find((b) => b.id === branchId) ??
    branches.data?.find((b) => b.active);
  const fits = (item: { branchId?: string; active: boolean }) =>
    item.active && (!item.branchId || item.branchId === branch?.id);
  const offered = {
    services: services.data?.filter(fits) ?? [],
    packages: packages.data?.filter((p) => fits(p) && p.servicesActive) ?? [],
  };
  const [kind, itemId] = what.split(":");
  const free = useQuery({
    ...adminQuery(
      `availability?branchId=${branch?.id}&${kind}Id=${itemId}&from=${date}&days=1`,
      staffAvailability,
    ),
    enabled: Boolean(branch && itemId && date),
  });
  const times = (free.data?.barbers ?? [])
    .map((barber) => ({
      barber,
      slots: barber.days.find((d) => d.date === date)?.slots ?? [],
    }))
    .filter((row) => row.slots.length > 0);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!branch) return;
    const form = new FormData(event.currentTarget);
    const [barberId, startAt] = slot.split("|");
    const notes = value(form, "notes");
    book.mutate(
      {
        method: "POST",
        path: "appointments",
        body: {
          branchId: branch.id,
          barberId,
          [`${kind}Id`]: itemId,
          startAt,
          customer: { name: value(form, "name"), phone: value(form, "phone") },
          ...(notes ? { notes } : {}),
        },
      },
      {
        onSuccess: (result) => {
          if (!result.ok) return;
          setSlot("");
          onBooked(date);
        },
      },
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label={t.common.branch}
          value={branch?.id ?? ""}
          onChange={(event) => {
            setBranchId(event.target.value);
            setWhat("");
            setSlot("");
          }}
        >
          {branches.data
            ?.filter((b) => b.active)
            .map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
        </Select>
        <Select
          label={t.agenda.what}
          value={what}
          required
          onChange={(event) => {
            setWhat(event.target.value);
            setSlot("");
          }}
        >
          <option value="" disabled>
            {t.agenda.pick}
          </option>
          <optgroup label={t.services.services}>
            {offered.services.map((s) => (
              <option key={s.id} value={`service:${s.id}`}>
                {pick(s.name, locale)} · {s.durationMin} {t.common.minutes}
              </option>
            ))}
          </optgroup>
          {offered.packages.length > 0 && (
            <optgroup label={t.services.packages}>
              {offered.packages.map((p) => (
                <option key={p.id} value={`package:${p.id}`}>
                  {pick(p.name, locale)} · {p.durationMin} {t.common.minutes}
                </option>
              ))}
            </optgroup>
          )}
        </Select>
      </div>
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

      {itemId && (
        <div className="grid gap-3" aria-live="polite">
          {free.isPending ? (
            <p className="text-fg-muted">{t.common.loading}</p>
          ) : times.length === 0 ? (
            <p className="text-fg-muted">{t.agenda.noTimes}</p>
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
                          name="slot"
                          value={id}
                          required
                          checked={slot === id}
                          onChange={() => setSlot(id)}
                          className="sr-only"
                        />
                        {s.time}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          name="name"
          label={t.agenda.customerName}
          autoComplete="off"
          minLength={2}
          maxLength={80}
          required
        />
        <Field
          name="phone"
          type="tel"
          label={t.agenda.customerPhone}
          autoComplete="off"
          required
        />
      </div>
      <Field name="notes" label={t.agenda.notes} maxLength={500} />
      <Result result={book.data} t={t.common} />
      <Button type="submit" disabled={book.isPending || !slot}>
        {t.agenda.book}
      </Button>
    </form>
  );
}
