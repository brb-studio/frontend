import { expect, test } from "bun:test";
import {
  cityOf,
  dateBox,
  fromDateBox,
  hoursSummary,
  matches,
  promoPhase,
  todayHours,
  usesShare,
} from "./admin-view";

const day = (weekday: number, open: string, close: string) => ({
  weekday,
  open,
  close,
});

test("search ignores case and accents", () => {
  expect(matches("Andrés Garza", "andres")).toBe(true);
  expect(matches("Andrés Garza", "  ")).toBe(true);
  expect(matches("Andrés Garza", "luis")).toBe(false);
});

test("the week in a line, Monday first, equal days joined", () => {
  const week = [
    ...[1, 2, 3, 4, 5, 6].map((w) => day(w, "10:00", "20:00")),
    day(0, "11:00", "16:00"),
  ];
  expect(hoursSummary(week, "es")).toBe(
    "lun–sáb 10:00–20:00 · dom 11:00–16:00",
  );
  // A gap breaks the run; two shifts read together.
  expect(
    hoursSummary(
      [
        day(1, "10:00", "14:00"),
        day(1, "15:00", "20:00"),
        day(3, "10:00", "14:00"),
        day(3, "15:00", "20:00"),
      ],
      "es",
    ),
  ).toBe("lun 10:00–14:00, 15:00–20:00 · mié 10:00–14:00, 15:00–20:00");
  expect(hoursSummary([], "es")).toBe("");
});

test("today's hours follow the branch's calendar", () => {
  const week = [day(2, "10:00", "20:00")]; // Tuesday only
  // Tue 3 Nov 2026, 23:30 in Tijuana is already Wednesday in UTC.
  const lateTuesday = new Date("2026-11-04T07:30:00Z");
  expect(todayHours(week, "America/Tijuana", lateTuesday)).toBe("10:00–20:00");
  expect(todayHours(week, "UTC", lateTuesday)).toBe("");
});

test("zones read as cities", () => {
  expect(cityOf("America/Mexico_City")).toBe("Mexico City");
  expect(cityOf("America/Tijuana")).toBe("Tijuana");
});

test("a promotion is live, scheduled, ended or off", () => {
  const now = new Date("2026-11-03T12:00:00Z");
  expect(promoPhase({ active: true }, now)).toBe("live");
  expect(promoPhase({ active: false }, now)).toBe("off");
  expect(
    promoPhase({ active: true, startsAt: "2026-12-01T00:00:00Z" }, now),
  ).toBe("scheduled");
  expect(
    promoPhase({ active: true, endsAt: "2026-10-01T00:00:00Z" }, now),
  ).toBe("ended");
});

test("uses against the cap", () => {
  expect(usesShare(25, 100)).toBe(25);
  expect(usesShare(150, 100)).toBe(100);
  expect(usesShare(3)).toBeNull();
});

test("date boxes go back and forth on the device's calendar", () => {
  const start = fromDateBox("2026-11-10");
  const end = fromDateBox("2026-11-10", true);
  expect(start && dateBox(start)).toBe("2026-11-10");
  expect(end && dateBox(end)).toBe("2026-11-10");
  expect(end && start && Date.parse(end) > Date.parse(start)).toBe(true);
  expect(fromDateBox("")).toBeUndefined();
});
