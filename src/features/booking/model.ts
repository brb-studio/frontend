import { queryOptions } from "@tanstack/react-query";
import * as z from "zod";
import { formatDate } from "@/shared/i18n/format";
import type { Locale } from "@/shared/i18n/locales";

/** What to book: one service or one package, at one branch. */
export type BookingTarget = {
  branch: string;
  kind: "service" | "package";
  slug: string;
};

export const availabilitySchema = z.object({
  branch: z.object({
    slug: z.string(),
    name: z.string(),
    timeZone: z.string(),
  }),
  today: z.string(),
  dates: z.array(z.string()),
  durationMin: z.number().int(),
  barbers: z.array(
    z.object({
      slug: z.string(),
      name: z.string(),
      image: z.string().optional(),
      days: z.array(
        z.object({
          date: z.string(),
          slots: z.array(z.object({ startAt: z.string(), time: z.string() })),
        }),
      ),
    }),
  ),
});
export type Availability = z.output<typeof availabilitySchema>;

export const availabilityKey = (target: BookingTarget) =>
  ["availability", target.branch, target.kind, target.slug] as const;

export const availabilityPath = (target: BookingTarget) =>
  `branch=${encodeURIComponent(target.branch)}&${target.kind}=${encodeURIComponent(target.slug)}`;

/**
 * Free times for one branch and one service or package. In the browser this goes through the
 * frontend's own /api route (the API itself is never exposed to the browser); the server prefetches
 * the same key with its own query function.
 */
export const availabilityQuery = (target: BookingTarget) =>
  queryOptions({
    queryKey: availabilityKey(target),
    queryFn: async ({ signal }): Promise<Availability> => {
      const response = await fetch(
        `/api/availability?${availabilityPath(target)}`,
        { signal },
      );
      if (!response.ok) throw new Error(`availability ${response.status}`);
      return availabilitySchema.parse(await response.json());
    },
    // Times change as people book: refresh in the background every 30 s while the page is open.
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

const firstDayOfWeek: Record<Locale, number> = { en: 0, es: 1 };

const utc = (date: string) => new Date(`${date}T00:00:00Z`);
const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

/** Availability → what the picker renders: a month grid of the booking window, and each barber's times. */
export function toBookingOptions(availability: Availability, locale: Locale) {
  const { dates, durationMin, branch } = availability;
  const date = (value: string, options: Intl.DateTimeFormatOptions) =>
    capitalize(formatDate(value, locale, options));
  const long = (value: string) =>
    date(value, { weekday: "long", day: "numeric", month: "long" });
  const time = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: branch.timeZone,
  });

  const first = dates[0] ?? availability.today;
  const last = dates.at(-1) ?? first;
  const firstDay = firstDayOfWeek[locale];
  const lead = (utc(first).getUTCDay() - firstDay + 7) % 7;
  const cells = Array.from(
    { length: Math.ceil((lead + dates.length) / 7) * 7 },
    (_, i) => {
      const value = dates[i - lead];
      if (i < lead || !value) return null;
      return {
        date: value,
        day: date(value, { day: "numeric" }),
        long: long(value),
      };
    },
  );
  // 2024-01-07 was a Sunday: weekday names for the header, starting on the locale's first day.
  const weekdayAt = (offset: number) =>
    date(
      new Date(Date.UTC(2024, 0, 7 + ((firstDay + offset) % 7)))
        .toISOString()
        .slice(0, 10),
      { weekday: "narrow" },
    );

  return {
    durationMin,
    calendar: {
      month: capitalize(
        new Intl.DateTimeFormat(locale, {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).formatRange(utc(first), utc(last)),
      ),
      weekdays: Array.from({ length: 7 }, (_, i) => weekdayAt(i)),
      cells,
    },
    barbers: availability.barbers.map((barber) => ({
      slug: barber.slug,
      name: barber.name,
      image: barber.image,
      days: barber.days.map((day) => ({
        date: day.date,
        long: long(day.date),
        times: day.slots.map((slot) => ({
          value: slot.startAt,
          label: time.format(new Date(slot.startAt)),
          end: time.format(
            new Date(Date.parse(slot.startAt) + durationMin * 60_000),
          ),
        })),
      })),
    })),
  };
}

export type BookingOptions = ReturnType<typeof toBookingOptions>;
