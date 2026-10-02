"use server";

import * as z from "zod";
import { getService } from "@/entities/service/api";
import { defaultLocale, hasLocale } from "@/shared/i18n/locales";
import { getAvailability } from "./availability";

export type BookingError = "required" | "slotTaken" | "unavailable";
export type BookingState =
  | { booked?: true; formError?: BookingError }
  | undefined;

const schema = z.object({
  lang: z.string(),
  service: z.string().max(64),
  barber: z.string().max(64),
  date: z.iso.date(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function book(
  _: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { formError: "required" };
  const { lang, service: slug, barber, date, time } = parsed.data;
  const locale = hasLocale(lang) ? lang : defaultLocale;

  const service = await getService(slug, locale);
  if (!service) return { formError: "required" };
  const days = (await getAvailability(service.durationMin, locale)).find(
    (a) => a.barber.slug === barber,
  )?.days;
  if (!days?.some((d) => d.date === date && d.times.includes(time))) {
    return { formError: "slotTaken" };
  }

  if (process.env.BOOKING_DEMO !== "true") return { formError: "unavailable" };
  return { booked: true };
}
