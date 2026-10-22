import { expect, test } from "bun:test";
import { rangeOf } from "./periods";

test("periods are whole local days, weeks from Monday, months across a year end", () => {
  // Wednesday 2026-10-14.
  expect(rangeOf("today", "2026-10-14")).toEqual({
    from: "2026-10-14",
    to: "2026-10-14",
  });
  expect(rangeOf("yesterday", "2026-10-14").from).toBe("2026-10-13");
  expect(rangeOf("week", "2026-10-14")).toEqual({
    from: "2026-10-12",
    to: "2026-10-14",
  });
  expect(rangeOf("lastWeek", "2026-10-14")).toEqual({
    from: "2026-10-05",
    to: "2026-10-11",
  });
  // On a Sunday the week is still the one that began last Monday.
  expect(rangeOf("week", "2026-10-18").from).toBe("2026-10-12");
  expect(rangeOf("month", "2026-10-14").from).toBe("2026-10-01");
  expect(rangeOf("lastMonth", "2026-01-20")).toEqual({
    from: "2025-12-01",
    to: "2025-12-31",
  });
  expect(rangeOf("lastMonth", "2026-03-31").to).toBe("2026-02-28");
});
