"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  CalendarDays,
  Check,
  Phone,
  Tag,
  User,
} from "lucide-react";
import Image from "next/image";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { FormAlert, SubmitButton } from "@/shared/ui/form";
import { book, quote } from "./actions";
import {
  availabilityQuery,
  type BookingTarget,
  toBookingOptions,
} from "./model";
import { PayOnline } from "./pay-online";

const focusRing =
  "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-text";
const selected =
  "has-checked:border-accent has-checked:bg-accent has-checked:text-accent-fg";
const pill = `relative shrink-0 cursor-pointer snap-start rounded-full border border-line bg-card px-4 py-2.5 text-sm transition-colors duration-300 hover:border-accent-text ${selected} ${focusRing}`;

type Summary = { barber: string; day: string; time: string };

export function BookingForm({
  lang,
  item,
  branches,
  initialBranch,
  signedInCustomer,
  currency,
  paymentsOnline,
  t,
}: {
  lang: Locale;
  item: {
    kind: BookingTarget["kind"];
    slug: string;
    name: string;
    price: number;
  };
  branches: { slug: string; name: string }[];
  initialBranch: string;
  signedInCustomer: boolean;
  currency: string;
  paymentsOnline: boolean;
  t: Dictionary["booking"];
}) {
  const queryClient = useQueryClient();
  const [branch, setBranch] = useState(initialBranch);
  const target: BookingTarget = { branch, kind: item.kind, slug: item.slug };
  const availability = useQuery(availabilityQuery(target));
  const options = useMemo(
    () => availability.data && toBookingOptions(availability.data, lang),
    [availability.data, lang],
  );

  // Choices fall back to the first available one, so the form never points at a vanished slot.
  const [barberSlug, setBarberSlug] = useState("");
  const [date, setDate] = useState("");
  const [startAt, setStartAt] = useState("");
  const [code, setCode] = useState("");
  const barbers = options?.barbers ?? [];
  const barber =
    barbers.find((b) => b.slug === barberSlug) ??
    barbers.find((b) => b.days.length > 0) ??
    barbers[0];
  const day = barber?.days.find((d) => d.date === date) ?? barber?.days[0];
  const slot = day?.times.find((x) => x.value === startAt);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [missing, setMissing] = useState(false);

  const quoting = useMutation({ mutationFn: quote });
  const booking = useMutation({
    mutationFn: book,
    onSuccess: (result) => {
      if (result.ok || result.error === "slotTaken") {
        void queryClient.invalidateQueries({ queryKey: ["availability"] });
      }
    },
  });
  const quoted =
    quoting.data?.ok && quoting.variables?.code === code.trim()
      ? quoting.data
      : undefined;

  const formRef = useRef<HTMLFormElement>(null);
  const failed = booking.data && !booking.data.ok;
  useEffect(() => {
    if (failed)
      formRef.current?.querySelector<HTMLElement>('[role="alert"]')?.focus();
  }, [failed]);

  const price = (minor: number) => formatMoney(minor, currency, lang);

  if (booking.data?.ok && summary) {
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
          {item.name} · {summary.barber}
        </p>
        <p className="text-fg-muted">
          {summary.day} · {summary.time}
        </p>
        <p className="font-medium">
          {t.total}: {price(booking.data.appointment.totalMinor)}
        </p>
        {paymentsOnline && booking.data.appointment.totalMinor > 0 ? (
          <PayOnline
            lang={lang}
            appointmentId={booking.data.appointment.id}
            amountMinor={booking.data.appointment.totalMinor}
            currency={booking.data.appointment.currency}
            signedInCustomer={signedInCustomer}
            t={t}
          />
        ) : (
          <p className="text-sm text-fg-muted">{t.confirmedLead}</p>
        )}
        <ButtonLink href={`/${lang}/home`} className="mt-2">
          {t.home}
        </ButtonLink>
      </section>
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!barber || !day || !slot) {
      setMissing(true);
      return;
    }
    const form = new FormData(event.currentTarget);
    setSummary({
      barber: barber.name,
      day: day.long,
      time: `${slot.label} – ${slot.end}`,
    });
    booking.mutate({
      ...target,
      barber: barber.slug,
      startAt: slot.value,
      customer: signedInCustomer
        ? undefined
        : {
            name: String(form.get("name") ?? ""),
            phone: String(form.get("phone") ?? ""),
          },
      code,
    });
  }

  const fieldError = (field: "name" | "phone") =>
    booking.data && !booking.data.ok && booking.data.fields?.includes(field)
      ? t.errors.invalid
      : undefined;

  return (
    <section aria-labelledby="booking-title" className="grid gap-5">
      <h2 id="booking-title" className="text-xl font-medium">
        {t.title}
      </h2>
      <form ref={formRef} onSubmit={submit} noValidate className="grid gap-6">
        {branches.length > 1 && (
          <fieldset>
            <legend className="mb-3 text-sm font-medium text-fg-muted">
              {t.branch}
            </legend>
            <div className="-mx-4 flex snap-x gap-2 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
              {branches.map((b) => (
                <label key={b.slug} className={pill}>
                  <input
                    type="radio"
                    name="branch"
                    value={b.slug}
                    checked={b.slug === branch}
                    onChange={() => {
                      setBranch(b.slug);
                      setBarberSlug("");
                      setDate("");
                      setStartAt("");
                    }}
                    className="sr-only"
                  />
                  {b.name}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {availability.isPending ? (
          <p
            role="status"
            className="rounded-3xl border border-line bg-card p-5 text-fg-muted"
          >
            {t.loading}
          </p>
        ) : availability.isError ? (
          <div className="grid gap-3">
            <FormAlert>{t.errors.unavailable}</FormAlert>
            <Button
              variant="secondary"
              onClick={() => void availability.refetch()}
            >
              {t.retry}
            </Button>
          </div>
        ) : (
          <>
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-fg-muted">
                {t.barber}
              </legend>
              <div className="flex flex-wrap gap-5">
                {barbers.map((b) => (
                  <label
                    key={b.slug}
                    className="group relative grid cursor-pointer justify-items-center gap-1.5 text-xs font-medium"
                  >
                    <input
                      type="radio"
                      name="barber"
                      value={b.slug}
                      checked={b.slug === barber?.slug}
                      onChange={() => {
                        setBarberSlug(b.slug);
                        setStartAt("");
                      }}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className="relative grid size-13 place-items-center overflow-hidden rounded-full border border-line bg-card text-lg transition-colors duration-300 group-has-checked:border-accent group-has-checked:bg-accent group-has-checked:text-accent-fg group-has-checked:ring-2 group-has-checked:ring-accent group-has-focus-visible:outline-2 group-has-focus-visible:outline-offset-2 group-has-focus-visible:outline-accent-text"
                    >
                      {b.image ? (
                        <Image
                          src={b.image}
                          alt=""
                          fill
                          sizes="52px"
                          className="object-cover"
                        />
                      ) : (
                        b.name.charAt(0)
                      )}
                    </span>
                    {b.name}
                  </label>
                ))}
              </div>
            </fieldset>

            {options && barber && day ? (
              <>
                <div className="grid gap-6 md:grid-cols-2 md:gap-10">
                  <fieldset>
                    <legend className="mb-2 text-base font-medium">
                      {options.calendar.month}
                      <span className="sr-only"> ({t.date})</span>
                    </legend>
                    <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
                      {options.calendar.weekdays.map((w, i) => (
                        <span
                          // biome-ignore lint/suspicious/noArrayIndexKey: fixed 7-column header; narrow labels repeat (S, M…).
                          key={i}
                          aria-hidden="true"
                          className="pb-1 text-xs text-fg-muted"
                        >
                          {w}
                        </span>
                      ))}
                      {options.calendar.cells.map((cell, i) => {
                        if (!cell) {
                          // biome-ignore lint/suspicious/noArrayIndexKey: blank padding cells have no identity.
                          return <span key={i} />;
                        }
                        const free = barber.days.some(
                          (d) => d.date === cell.date,
                        );
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
                              checked={cell.date === day.date}
                              onChange={() => {
                                setDate(cell.date);
                                setStartAt("");
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
                    <legend className="mb-2 text-base font-medium">
                      {t.time}
                    </legend>
                    <div className="-mx-4 flex snap-x gap-2 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
                      {day.times.map((x) => (
                        <label key={x.value} className={pill}>
                          <input
                            type="radio"
                            name="time"
                            value={x.value}
                            checked={x.value === slot?.value}
                            onChange={() => setStartAt(x.value)}
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

                {!signedInCustomer && (
                  <fieldset className="grid gap-4">
                    <legend className="mb-1 text-base font-medium">
                      {t.guestTitle}
                    </legend>
                    <Field
                      name="name"
                      label={t.name}
                      autoComplete="name"
                      required
                      icon={<User size={18} />}
                      error={fieldError("name")}
                    />
                    <Field
                      name="phone"
                      type="tel"
                      label={t.phone}
                      autoComplete="tel"
                      inputMode="tel"
                      required
                      hint={t.phoneHint}
                      icon={<Phone size={18} />}
                      error={fieldError("phone")}
                    />
                  </fieldset>
                )}

                <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                  <Field
                    name="code"
                    label={t.promoCode}
                    autoComplete="off"
                    autoCapitalize="characters"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    icon={<Tag size={18} />}
                  />
                  <Button
                    variant="secondary"
                    disabled={!code.trim() || quoting.isPending}
                    onClick={() => quoting.mutate({ ...target, code })}
                    className="h-13"
                  >
                    {t.apply}
                  </Button>
                </div>

                <dl
                  aria-live="polite"
                  className="grid gap-1 rounded-3xl border border-line bg-card px-4 py-3 text-sm"
                >
                  {quoted && quoted.discountMinor > 0 && (
                    <div className="flex justify-between gap-4 text-fg-muted">
                      <dt>{t.discount}</dt>
                      <dd>−{price(quoted.discountMinor)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4 font-medium">
                    <dt>{t.total}</dt>
                    <dd>{price(quoted ? quoted.totalMinor : item.price)}</dd>
                  </div>
                  {quoted?.rejected && (
                    <p className="text-fg-muted">{t.promoRejected}</p>
                  )}
                </dl>

                {booking.data && !booking.data.ok && (
                  <FormAlert>{t.errors[booking.data.error]}</FormAlert>
                )}
                {missing && !slot && <FormAlert>{t.errors.required}</FormAlert>}
                <SubmitButton
                  pending={booking.isPending}
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
          </>
        )}
      </form>
    </section>
  );
}
