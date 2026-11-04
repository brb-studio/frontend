import { expect, test } from "bun:test";
import { bySoonest, expiresToday } from "./pickups-model";

test("the closest to expiring comes first", () => {
  const list = [
    { id: "late", expiresAt: "2026-11-10T20:00:00Z" },
    { id: "soon", expiresAt: "2026-11-04T01:00:00Z" },
    { id: "mid", expiresAt: "2026-11-06T18:00:00Z" },
  ];
  expect(bySoonest(list).map((p) => p.id)).toEqual(["soon", "mid", "late"]);
  // The original order is kept.
  expect(list[0]?.id).toBe("late");
});

test("tells apart today from another day", () => {
  const now = new Date(2026, 10, 3, 12, 0);
  expect(expiresToday(new Date(2026, 10, 3, 23, 30).toISOString(), now)).toBe(
    true,
  );
  expect(expiresToday(new Date(2026, 10, 4, 0, 30).toISOString(), now)).toBe(
    false,
  );
});
