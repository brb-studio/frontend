import { expect, test } from "bun:test";
import { addMinutes, branchNow, freeSlots } from "./slots";

const hours = [{ from: 1, to: 5, open: "10:00", close: "12:00" }];

test("free slots skip past times, bookings, closed days and services that don't fit", () => {
  const days = freeSlots({
    hours,
    busy: { 2: [["10:30", "11:00"]] },
    durationMin: 45,
    now: { date: "2026-10-05", minutes: 10 * 60 + 15 },
    days: 7,
  });

  expect(days).toEqual([
    { date: "2026-10-05", times: ["10:30", "11:00"] },
    { date: "2026-10-06", times: ["11:00"] },
    { date: "2026-10-07", times: ["10:00", "10:30", "11:00"] },
    { date: "2026-10-08", times: ["10:00", "10:30", "11:00"] },
    { date: "2026-10-09", times: ["10:00", "10:30", "11:00"] },
  ]);
});

test("branch time is the branch's wall clock, not the server's", () => {
  expect(
    branchNow("America/Mexico_City", new Date("2026-10-06T05:30:00Z")),
  ).toEqual({ date: "2026-10-05", minutes: 23 * 60 + 30 });
  expect(addMinutes("11:30", 45)).toBe("12:15");
});
