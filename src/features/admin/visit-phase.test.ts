import { expect, test } from "bun:test";
import { nextToStart, phaseOf, shopClock, splitMyDay } from "./visit-phase";

// 13:55 in Mexico City (the reported case: the device was at 11:55 in Baja California).
const NOW = Date.parse("2026-11-03T19:55:00Z");
const v = (id: string, status: string, start: string, end: string) => ({
  id,
  status,
  startAt: `2026-11-03T${start}:00Z`,
  endAt: `2026-11-03T${end}:00Z`,
});
const day = [
  v("a", "completed", "17:00", "18:00"), // 11:00, closed
  v("b", "confirmed", "18:00", "18:40"), // 12:00, over and not closed
  v("c", "confirmed", "19:00", "20:00"), // 13:00, being attended
  v("d", "confirmed", "21:00", "22:00"), // 15:00, next
  v("e", "confirmed", "22:15", "23:15"), // 16:15
];

test("each visit says where it stands", () => {
  expect(day.map((a) => phaseOf(a, NOW))).toEqual([
    "closed",
    "toClose",
    "inProgress",
    "upcoming",
    "upcoming",
  ]);
  expect(phaseOf(v("p", "pending_payment", "21:00", "22:00"), NOW)).toBe(
    "upcoming",
  );
  expect(phaseOf(v("x", "no_show", "21:00", "22:00"), NOW)).toBe("closed");
});

test("the one being attended is current, not next", () => {
  const { current, next, active, done } = splitMyDay(day, NOW);
  expect(current?.id).toBe("c");
  expect(next?.id).toBe("d");
  expect(active.map((a) => a.id)).toEqual(["b", "c", "d", "e"]);
  expect(done.map((a) => a.id)).toEqual(["a"]);
  expect(nextToStart(day, NOW)?.id).toBe("d");
});

test("the shop's clock only shows when it differs from the device", () => {
  const now = new Date(NOW);
  const here = Intl.DateTimeFormat().resolvedOptions().timeZone;
  expect(shopClock(here, "es", now)).toBeNull();
  const elsewhere =
    here === "Asia/Tokyo" ? "America/Mexico_City" : "Asia/Tokyo";
  expect(shopClock(elsewhere, "es", now)).not.toBeNull();
});
