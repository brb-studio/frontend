import { expect, test } from "bun:test";
import { byCollected, shareOf, totalOf } from "./cash-model";

const row = (id: string, cash: number, card: number, transfer: number) => ({
  id,
  cashMinor: cash,
  cardMinor: card,
  transferMinor: transfer,
});

test("a person's total adds every method", () => {
  expect(totalOf(row("a", 100, 250, 50))).toBe(400);
});

test("whoever collected most comes first; ties keep their order", () => {
  const ranked = byCollected([
    row("ana", 100, 0, 0),
    row("beto", 0, 500, 0),
    row("caro", 50, 50, 0),
  ]);
  expect(ranked.map((p) => [p.id, p.totalMinor])).toEqual([
    ["beto", 500],
    ["ana", 100],
    ["caro", 100],
  ]);
});

test("share of the day, safe on an empty day", () => {
  expect(shareOf(250, 1000)).toBe(25);
  expect(shareOf(1, 3)).toBe(33);
  expect(shareOf(0, 0)).toBe(0);
});
