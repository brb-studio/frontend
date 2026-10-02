import { getBarbers } from "@/entities/barber/api";
import { getTenant } from "@/entities/tenant/api";
import { formatDate, formatTime } from "@/shared/i18n/format";
import type { Locale } from "@/shared/i18n/locales";
import { addMinutes, branchNow, freeSlots } from "./slots";

const WINDOW_DAYS = 14;

const firstDayOfWeek: Record<Locale, number> = { en: 0, es: 1 };

export async function getAvailability(durationMin: number, locale: Locale) {
  const [tenant, barbers] = await Promise.all([
    getTenant(),
    getBarbers(locale),
  ]);
  return barbers.flatMap((barber) => {
    const branch = tenant.branches.find((b) => b.slug === barber.branch);
    if (!branch) return [];
    const now = branchNow(branch.timeZone);
    const days = freeSlots({
      hours: branch.hours,
      busy: barber.busy,
      durationMin,
      now,
      days: WINDOW_DAYS,
    });
    return [{ barber, today: now.date, days }];
  });
}

const utc = (date: string) => new Date(`${date}T00:00:00Z`);
const shift = (date: string, days: number) =>
  new Date(utc(date).getTime() + days * 864e5).toISOString().slice(0, 10);

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

export async function getBookingOptions(durationMin: number, locale: Locale) {
  const availability = await getAvailability(durationMin, locale);
  const date = (value: string, options: Intl.DateTimeFormatOptions) =>
    capitalize(formatDate(value, locale, options));
  const long = (value: string) =>
    date(value, { weekday: "long", day: "numeric", month: "long" });

  const start =
    availability.map((a) => a.today).sort()[0] ??
    new Date().toISOString().slice(0, 10);
  const end = shift(start, WINDOW_DAYS - 1);
  const firstDay = firstDayOfWeek[locale];
  const lead = (utc(start).getUTCDay() - firstDay + 7) % 7;
  const cells = Array.from(
    { length: Math.ceil((lead + WINDOW_DAYS) / 7) * 7 },
    (_, i) => {
      if (i < lead || i >= lead + WINDOW_DAYS) return null;
      const value = shift(start, i - lead);
      return {
        date: value,
        day: date(value, { day: "numeric" }),
        long: long(value),
      };
    },
  );

  return {
    calendar: {
      month: capitalize(
        new Intl.DateTimeFormat(locale, {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).formatRange(utc(start), utc(end)),
      ),
      weekdays: Array.from({ length: 7 }, (_, i) =>
        date(shift("2024-01-07", (firstDay + i) % 7), { weekday: "narrow" }),
      ),
      cells,
    },
    barbers: availability.map(({ barber, days }) => ({
      slug: barber.slug,
      name: barber.name,
      days: days.map(({ date: value, times }) => ({
        date: value,
        long: long(value),
        times: times.map((time) => ({
          value: time,
          label: formatTime(time, locale),
          end: formatTime(addMinutes(time, durationMin), locale),
        })),
      })),
    })),
  };
}

export type BookingOptions = Awaited<ReturnType<typeof getBookingOptions>>;
