"use client";

import { CalendarCheck, CalendarDays, Check } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { ButtonLink } from "@/shared/ui/button";
import { FormAlert, SubmitButton } from "@/shared/ui/form";
import { book } from "./actions";
import type { BookingOptions } from "./availability";

const focusRing =
  "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-text";
const selected =
  "has-checked:border-accent has-checked:bg-accent has-checked:text-accent-fg";

export function BookingForm({
  lang,
  service,
  serviceName,
  options: { calendar, barbers },
  t,
}: {
  lang: Locale;
  service: string;
  serviceName: string;
  options: BookingOptions;
  t: Dictionary["booking"];
}) {
  const [state, formAction, pending] = useActionState(book, undefined);
  const [barberSlug, setBarberSlug] = useState(barbers[0]?.slug ?? "");
  const barber = barbers.find((b) => b.slug === barberSlug);
  const [date, setDate] = useState(barber?.days[0]?.date ?? "");
  const day = barber?.days.find((d) => d.date === date);
  const [time, setTime] = useState("");
  const slot = day?.times.find((x) => x.value === time);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.formError) {
      formRef.current?.querySelector<HTMLElement>('[role="alert"]')?.focus();
    }
  }, [state]);

  if (state?.booked && barber && day && slot) {
    return (
      <section
        role="status"
        className="grid animate-rise justify-items-center gap-3 rounded-[2rem] border border-line bg-card p-8 text-center shadow-soft"
      >
        <span className="grid size-16 place-items-center rounded-full bg-accent text-accent-fg shadow-glow">
          <Check size={28} aria-hidden="true" />
        </span>
        <h2 className="text-2xl font-medium">{t.confirmedTitle}</h2>
        <p className="font-medium">
          {serviceName} · {barber.name}
        </p>
        <p className="text-fg-muted">
          {day.long} · {slot.label} – {slot.end}
        </p>
        <p className="text-sm text-fg-muted">{t.confirmedLead}</p>
        <ButtonLink href={`/${lang}/home`} className="mt-2">
          {t.home}
        </ButtonLink>
      </section>
    );
  }

  return (
    <section aria-labelledby="booking-title" className="grid gap-5">
      <h2 id="booking-title" className="text-xl font-medium">
        {t.title}
      </h2>
      <form ref={formRef} action={formAction} className="grid gap-6">
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="service" value={service} />

        <fieldset>
          <legend className="mb-3 text-sm font-medium text-fg-muted">
            {t.barber}
          </legend>
          <div className="flex gap-5">
            {barbers.map((b) => (
              <label
                key={b.slug}
                className="group relative grid cursor-pointer justify-items-center gap-1.5 text-xs font-medium"
              >
                <input
                  type="radio"
                  name="barber"
                  value={b.slug}
                  checked={b.slug === barberSlug}
                  onChange={() => {
                    setBarberSlug(b.slug);
                    if (!b.days.some((d) => d.date === date)) {
                      setDate(b.days[0]?.date ?? "");
                    }
                    setTime("");
                  }}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className="grid size-13 place-items-center rounded-full border border-line bg-card text-lg transition-colors duration-300 group-has-checked:border-accent group-has-checked:bg-accent group-has-checked:text-accent-fg group-has-focus-visible:outline-2 group-has-focus-visible:outline-offset-2 group-has-focus-visible:outline-accent-text"
                >
                  {b.name.charAt(0)}
                </span>
                {b.name}
              </label>
            ))}
          </div>
        </fieldset>

        {barber && day ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 md:gap-10">
              <fieldset>
                <legend className="mb-2 text-base font-medium">
                  {calendar.month}
                  <span className="sr-only"> ({t.date})</span>
                </legend>
                <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
                  {calendar.weekdays.map((w, i) => (
                    <span
                      // biome-ignore lint/suspicious/noArrayIndexKey: fixed 7-column header; narrow labels repeat (S, M…).
                      key={i}
                      aria-hidden="true"
                      className="pb-1 text-xs text-fg-muted"
                    >
                      {w}
                    </span>
                  ))}
                  {calendar.cells.map((cell, i) => {
                    if (!cell) {
                      // biome-ignore lint/suspicious/noArrayIndexKey: blank padding cells have no identity.
                      return <span key={i} />;
                    }
                    const free = barber.days.some((d) => d.date === cell.date);
                    return (
                      <label
                        key={cell.date}
                        className={`relative mx-auto grid aspect-square w-full max-w-11 place-items-center rounded-full border transition-colors duration-300 ${
                          free
                            ? `cursor-pointer border-line bg-card font-medium hover:border-accent-text ${selected} ${focusRing}`
                            : "border-transparent text-fg-muted line-through decoration-fg-muted/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="date"
                          value={cell.date}
                          aria-label={cell.long}
                          disabled={!free}
                          checked={cell.date === date}
                          onChange={() => {
                            setDate(cell.date);
                            setTime("");
                          }}
                          className="sr-only"
                        />
                        {cell.day}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="min-w-0">
                <legend className="mb-2 text-base font-medium">{t.time}</legend>
                <div className="-mx-4 flex snap-x gap-2 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
                  {day.times.map((x) => (
                    <label
                      key={x.value}
                      className={`relative shrink-0 cursor-pointer snap-start rounded-full border border-line bg-card px-4 py-2.5 text-sm transition-colors duration-300 hover:border-accent-text ${selected} ${focusRing}`}
                    >
                      <input
                        type="radio"
                        name="time"
                        value={x.value}
                        required
                        checked={x.value === time}
                        onChange={() => setTime(x.value)}
                        className="sr-only"
                      />
                      {x.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <p
              aria-live="polite"
              className="flex items-center justify-between gap-4 rounded-3xl border border-line bg-card px-4 py-3 text-sm"
            >
              <span className="flex items-center gap-2">
                <CalendarDays
                  size={18}
                  aria-hidden="true"
                  className="shrink-0 text-accent-text"
                />
                {day.long}
              </span>
              <span className="shrink-0 text-fg-muted">
                {slot ? `${slot.label} – ${slot.end}` : t.pickTime}
              </span>
            </p>

            {state?.formError && (
              <FormAlert>{t.errors[state.formError]}</FormAlert>
            )}
            <SubmitButton
              pending={pending}
              icon={<CalendarCheck size={18} aria-hidden="true" />}
            >
              {t.submit}
            </SubmitButton>
          </>
        ) : (
          <p className="rounded-3xl border border-line bg-card p-5 text-fg-muted">
            {t.noSlots}
          </p>
        )}
      </form>
    </section>
  );
}
