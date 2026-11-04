import { expect, test } from "bun:test";
import {
  bestDay,
  breakdown,
  changeOf,
  connectStep,
  depositFor,
  masked,
  minutesLeft,
  previousRange,
} from "./money-view";

test("a period is compared with the same days right before it", () => {
  expect(previousRange("2026-11-03", "2026-11-03")).toEqual({
    from: "2026-11-02",
    to: "2026-11-02",
  });
  expect(previousRange("2026-11-02", "2026-11-08")).toEqual({
    from: "2026-10-26",
    to: "2026-11-01",
  });
  expect(previousRange("2026-03-01", "2026-03-03")).toEqual({
    from: "2026-02-26",
    to: "2026-02-28",
  });
});

test("change against before, none when there was nothing", () => {
  expect(changeOf(112, 100)).toBe(12);
  expect(changeOf(80, 100)).toBe(-20);
  expect(changeOf(50, 0)).toBeNull();
});

test("the ways money came in, biggest first, with their share", () => {
  expect(
    breakdown([
      ["cash", 300],
      ["card", 600],
      ["transfer", 0],
      ["online", 100],
    ]),
  ).toEqual([
    { key: "card", minor: 600, share: 60 },
    { key: "cash", minor: 300, share: 30 },
    { key: "online", minor: 100, share: 10 },
  ]);
  expect(breakdown([["cash", 0]])).toEqual([]);
});

test("the best day is the biggest one, if anything was made", () => {
  const days = [
    { date: "a", totalMinor: 10 },
    { date: "b", totalMinor: 30 },
    { date: "c", totalMinor: 30 },
  ];
  expect(bestDay(days)?.date).toBe("b");
  expect(bestDay([{ date: "a", totalMinor: 0 }])).toBeUndefined();
});

test("minutes left until a transfer expires", () => {
  const now = new Date("2026-11-03T12:00:00Z");
  expect(minutesLeft("2026-11-03T14:30:00Z", now)).toBe(150);
  expect(minutesLeft("2026-11-03T11:00:00Z", now)).toBeLessThan(0);
});

test("an account key shows only its last 4 digits", () => {
  expect(masked("012180001234567890")).toBe("•••• 7890");
});

test("the deposit follows the API: up to a whole peso, at least Stripe's minimum, never over the total", () => {
  expect(depositFor(25_000, 2_500, "MXN")).toBe(6_300);
  expect(depositFor(30_000, 3_000, "MXN")).toBe(9_000);
  expect(depositFor(2_000, 1_000, "MXN")).toBe(1_000);
  expect(depositFor(800, 5_000, "MXN")).toBe(800);
  expect(depositFor(3_000, 1_000, "USD")).toBe(300);
});

test("Stripe's sign-up reads as steps", () => {
  expect(connectStep("none")).toBe(0);
  expect(connectStep("onboarding")).toBe(1);
  expect(connectStep("pending")).toBe(2);
  expect(connectStep("restricted")).toBe(2);
  expect(connectStep("active")).toBe(3);
});
