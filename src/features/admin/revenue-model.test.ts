import { expect, test } from "bun:test";
import {
  changeOf,
  csvOf,
  groupFor,
  rangeFor,
  shareOf,
  shift,
} from "./revenue-model";

test("weeks run Monday to Sunday and months cover the whole month", () => {
  expect(rangeFor("week", "2026-11-05")).toEqual({
    from: "2026-11-02",
    to: "2026-11-08",
  });
  expect(rangeFor("week", "2026-11-01")).toEqual({
    from: "2026-10-26",
    to: "2026-11-01",
  });
  expect(rangeFor("month", "2026-02-14")).toEqual({
    from: "2026-02-01",
    to: "2026-02-28",
  });
});

test("moving a period steps a day, a week, a month or the range's own length", () => {
  expect(shift("day", { from: "2026-11-01", to: "2026-11-01" }, -1)).toEqual({
    from: "2026-10-31",
    to: "2026-10-31",
  });
  expect(shift("week", rangeFor("week", "2026-11-05"), 1)).toEqual({
    from: "2026-11-09",
    to: "2026-11-15",
  });
  expect(shift("month", rangeFor("month", "2026-01-20"), -1)).toEqual({
    from: "2025-12-01",
    to: "2025-12-31",
  });
  expect(shift("range", { from: "2026-11-01", to: "2026-11-10" }, 1)).toEqual({
    from: "2026-11-11",
    to: "2026-11-20",
  });
});

test("long ranges chart by week, then by month", () => {
  expect(groupFor({ from: "2026-11-01", to: "2026-11-30" })).toBe("day");
  expect(groupFor({ from: "2026-09-01", to: "2026-11-30" })).toBe("week");
  expect(groupFor({ from: "2026-01-01", to: "2026-12-31" })).toBe("month");
});

test("change and share are whole percentages, safe on zero", () => {
  expect(changeOf(112, 100)).toBe(12);
  expect(changeOf(5, 0)).toBeNull();
  expect(shareOf(1, 3)).toBe(33);
  expect(shareOf(0, 0)).toBe(0);
});

test("CSV quotes only the cells that need it", () => {
  expect(
    csvOf([
      ["Corte + Barba", 'Juan "JP"', "a,b"],
      ["1", "2", "3"],
    ]),
  ).toBe('Corte + Barba,"Juan ""JP""","a,b"\n1,2,3');
});
