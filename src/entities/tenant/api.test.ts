import { expect, test } from "bun:test";
import { groupHours } from "./api";

test("per-weekday hours group into runs of identical days, Monday first, split shifts kept", () => {
  const week = [1, 2, 3, 4, 5].map((weekday) => ({
    weekday,
    open: "10:00",
    close: "20:00",
  }));
  expect(
    groupHours([
      ...week,
      { weekday: 6, open: "10:00", close: "14:00" },
      { weekday: 6, open: "15:00", close: "18:00" },
    ]),
  ).toEqual([
    { from: 1, to: 5, open: "10:00", close: "20:00" },
    { from: 6, to: 6, open: "10:00", close: "14:00" },
    { from: 6, to: 6, open: "15:00", close: "18:00" },
  ]);
  // A closed day in the middle breaks the run.
  expect(
    groupHours([
      { weekday: 1, open: "09:00", close: "17:00" },
      { weekday: 3, open: "09:00", close: "17:00" },
    ]),
  ).toEqual([
    { from: 1, to: 1, open: "09:00", close: "17:00" },
    { from: 3, to: 3, open: "09:00", close: "17:00" },
  ]);
});
