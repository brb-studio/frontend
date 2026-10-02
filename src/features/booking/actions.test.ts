import { afterEach, expect, test } from "bun:test";
import { getService } from "@/entities/service/api";
import { book } from "./actions";
import { getAvailability } from "./availability";

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
};

afterEach(() => {
  delete process.env.BOOKING_DEMO;
});

test("a free slot is confirmed only in demo mode; a taken or made-up one never", async () => {
  const service = await getService("haircut", "es");
  if (!service) throw new Error("sample data has no haircut");
  const [first] = await getAvailability(service.durationMin, "es");
  const day = first?.days[0];
  const time = day?.times[0];
  if (!first || !day || !time) throw new Error("sample barber has no slots");

  const slot = {
    lang: "es",
    service: service.slug,
    barber: first.barber.slug,
    date: day.date,
    time,
  };
  expect(await book(undefined, form(slot))).toEqual({
    formError: "unavailable",
  });

  process.env.BOOKING_DEMO = "true";
  expect(await book(undefined, form(slot))).toEqual({ booked: true });
  expect(await book(undefined, form({ ...slot, time: "03:00" }))).toEqual({
    formError: "slotTaken",
  });
  expect(await book(undefined, form({ ...slot, barber: "nobody" }))).toEqual({
    formError: "slotTaken",
  });
});
