import { expect, test } from "bun:test";
import { byNoticeDay, noticeAgo, noticeDay } from "./notice-time";

const TZ = "America/Mexico_City";
// 2026-11-03 12:40 in Mexico City.
const NOW = new Date("2026-11-03T18:40:00Z");
const text = {
  justNow: "Ahora",
  minutes: "Hace {n} min",
  hours: "Hace {n} h",
  yesterday: "Ayer, {time}",
};
const ago = (at: string) => noticeAgo(at, TZ, "es", text, NOW);

test("recent notices read as time ago", () => {
  expect(ago("2026-11-03T18:39:30Z")).toBe("Ahora");
  expect(ago("2026-11-03T18:35:00Z")).toBe("Hace 5 min");
  expect(ago("2026-11-03T17:41:00Z")).toBe("Hace 59 min");
  expect(ago("2026-11-03T15:30:00Z")).toBe("Hace 3 h");
  // A clock slightly ahead is still "just now".
  expect(ago("2026-11-03T18:41:00Z")).toBe("Ahora");
});

test("older notices show the day and time they arrived", () => {
  expect(ago("2026-11-02T20:37:00Z")).toBe("Ayer, 14:37");
  expect(ago("2026-10-27T20:37:00Z")).toMatch(/27 oct/);
});

test("the day is the shop's, not UTC", () => {
  // 01:00 UTC on the 3rd is still the 2nd in Mexico City: yesterday.
  expect(noticeDay("2026-11-03T01:00:00Z", TZ, NOW)).toBe("yesterday");
  expect(noticeDay("2026-11-03T07:00:00Z", TZ, NOW)).toBe("today");
  expect(noticeDay("2026-11-01T18:00:00Z", TZ, NOW)).toBe("earlier");
});

test("groups keep the newest-first order", () => {
  const n = (id: string, createdAt: string) => ({
    id,
    createdAt,
    summary: { timeZone: TZ },
  });
  const groups = byNoticeDay(
    [
      n("a", "2026-11-03T18:40:00Z"),
      n("b", "2026-11-03T13:06:00Z"),
      n("c", "2026-11-02T20:37:00Z"),
      n("d", "2026-10-20T10:00:00Z"),
    ],
    NOW,
  );
  expect(groups.map((g) => [g.day, g.items.map((i) => i.id)])).toEqual([
    ["today", ["a", "b"]],
    ["yesterday", ["c"]],
    ["earlier", ["d"]],
  ]);
});
