"use client";

import { useQuery } from "@tanstack/react-query";
import { type FormEvent, type ReactNode, useState } from "react";
import * as z from "zod";
import { availabilitySchema } from "@/features/booking/model";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { formatMoney } from "@/shared/i18n/money";
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

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid min-w-0 gap-3">
      <legend className="mb-3 text-sm font-medium text-accent-text">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

/** A walk-in or phone booking: what and where, when, and who; with a summary before saving. */
export function NewAppointmentForm({
  locale,
  t,
  day,
  onBooked,
  currency = "MXN",
}: {
  locale: Locale;
  t: AdminText;
  day: string;
  /** The booked day, and what was booked in words. */
  onBooked: (date: string, message: string) => void;
  currency?: string;
}) {
  const branches = useQuery(branchesQuery);
  const services = useQuery(servicesQuery);
  const packages = useQuery(packagesQuery);
  const [branchId, setBranchId] = useState("");
  const [what, setWhat] = useState("");
  const [date, setDate] = useState(day);
  const [slot, setSlot] = useState("");
  const [name, setName] = useState("");
  const book = useAdminAction();
  const text = t.agenda;

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
  const item =
    kind === "service"
      ? offered.services.find((s) => s.id === itemId)
      : offered.packages.find((p) => p.id === itemId);
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
  const [barberId, startAt] = slot.split("|");
  const chosen = times.find((row) => row.barber.id === barberId);
  const chosenTime = chosen?.slots.find((s) => s.startAt === startAt)?.time;
  const dayLabel = date
    ? new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      }).format(new Date(`${date}T12:00:00Z`))
    : "";
  const summary =
    item && chosen && chosenTime
      ? [
          pick(item.name, locale),
          `${dayLabel}, ${chosenTime}`,
          chosen.barber.name,
          branch?.name,
          formatMoney(item.priceMinor, currency, locale),
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!branch || !summary) return;
    const form = new FormData(event.currentTarget);
    const notes = value(form, "notes");
    const customer = value(form, "name");
    book.mutate(
      {
        method: "POST",
        path: "appointments",
        body: {
          branchId: branch.id,
          barberId,
          [`${kind}Id`]: itemId,
          startAt,
          customer: { name: customer, phone: value(form, "phone") },
          ...(notes ? { notes } : {}),
        },
      },
      {
        onSuccess: (result) => {
          if (!result.ok) return;
          setSlot("");
          onBooked(
            date,
            text.booked.replace("{who}", `${customer} · ${summary}`),
          );
        },
      },
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <Step title={text.stepWhat}>
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
            label={text.what}
            value={what}
            required
            onChange={(event) => {
              setWhat(event.target.value);
              setSlot("");
            }}
          >
            <option value="" disabled>
              {text.pick}
            </option>
            <optgroup label={t.services.services}>
              {offered.services.map((s) => (
                <option key={s.id} value={`service:${s.id}`}>
                  {pick(s.name, locale)} · {s.durationMin} {t.common.minutes} ·{" "}
                  {formatMoney(s.priceMinor, currency, locale)}
                </option>
              ))}
            </optgroup>
            {offered.packages.length > 0 && (
              <optgroup label={t.services.packages}>
                {offered.packages.map((p) => (
                  <option key={p.id} value={`package:${p.id}`}>
                    {pick(p.name, locale)} ·{" "}
                    {formatMoney(p.priceMinor, currency, locale)}
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
        </div>
      </Step>

      <Step title={text.stepWhen}>
        <Field
          name="date"
          type="date"
          label={text.day}
          value={date}
          required
          onChange={(event) => {
            setDate(event.target.value);
            setSlot("");
          }}
        />
        {itemId ? (
          <div className="grid gap-4" aria-live="polite">
            {free.isPending ? (
              <p className="text-fg-muted">{t.common.loading}</p>
            ) : times.length === 0 ? (
              <p className="text-fg-muted">{text.noTimes}</p>
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
        ) : (
          <p className="text-sm text-fg-muted">{text.pick}</p>
        )}
      </Step>

      <Step title={text.stepWho}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            name="name"
            label={text.customerName}
            autoComplete="off"
            minLength={2}
            maxLength={80}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Field
            name="phone"
            type="tel"
            label={text.customerPhone}
            autoComplete="off"
            required
          />
        </div>
        <Field name="notes" label={text.notes} maxLength={500} />
      </Step>

      <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4 text-sm">
        {summary ? (
          <div className="grid gap-1">
            <p className="text-fg-muted">{text.summary}</p>
            <p className="font-medium">
              {[name.trim(), summary].filter(Boolean).join(" · ")}
            </p>
          </div>
        ) : (
          <p className="text-fg-muted">{text.pickTime}</p>
        )}
        {book.data && !book.data.ok && (
          <Result result={book.data} t={t.common} />
        )}
        <Button type="submit" disabled={book.isPending || !summary}>
          {text.book}
        </Button>
      </div>
    </form>
  );
}
