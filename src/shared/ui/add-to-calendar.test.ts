import { expect, test } from "bun:test";
import {
  type CalendarEvent,
  googleCalendarUrl,
  icsFile,
} from "./add-to-calendar";

const event: CalendarEvent = {
  id: "abc123",
  title: "Corte + Barba · Barbería Elite",
  startAt: "2026-11-05T17:30:00.000Z",
  endAt: "2026-11-05T18:15:00.000Z",
  location: "Elite Tijuana, Av. Revolución 1234, Zona Centro; Tijuana",
  details:
    "Con Juan\nReprogramar o cancelar: https://elite.brb-studio.cloud/es/account",
};

test("the Google link carries the UTC times, place and notes", () => {
  const url = new URL(googleCalendarUrl(event));
  expect(url.origin).toBe("https://calendar.google.com");
  expect(url.searchParams.get("action")).toBe("TEMPLATE");
  expect(url.searchParams.get("dates")).toBe(
    "20261105T173000Z/20261105T181500Z",
  );
  expect(url.searchParams.get("text")).toBe(event.title);
  expect(url.searchParams.get("location")).toBe(event.location ?? null);
  expect(url.searchParams.get("details")).toBe(event.details ?? null);
});

test("the .ics file is a valid single event with escaped text and a reminder", () => {
  const ics = icsFile(event, new Date("2026-11-04T12:00:00Z"));
  const lines = ics.split("\r\n");
  expect(lines[0]).toBe("BEGIN:VCALENDAR");
  expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  expect(lines).toContain("UID:abc123@brb-studio");
  expect(lines).toContain("DTSTAMP:20261104T120000Z");
  expect(lines).toContain("DTSTART:20261105T173000Z");
  expect(lines).toContain("DTEND:20261105T181500Z");
  expect(lines).toContain("TRIGGER:-PT1H");
  const unfolded = ics.replace(/\r\n /g, "");
  expect(unfolded).toContain(
    "LOCATION:Elite Tijuana\\, Av. Revolución 1234\\, Zona Centro\\; Tijuana",
  );
  expect(unfolded).toContain("DESCRIPTION:Con Juan\\nReprogramar o cancelar:");
  expect(lines.every((line) => Array.from(line).length <= 75)).toBe(true);
});

test("optional fields are left out instead of written empty", () => {
  const ics = icsFile({ ...event, location: undefined, details: undefined });
  expect(ics).not.toContain("LOCATION:");
  expect(ics.split("\r\n").filter((l) => l.startsWith("DESCRIPTION:"))).toEqual(
    [`DESCRIPTION:${"Corte + Barba · Barbería Elite"}`],
  );
});
