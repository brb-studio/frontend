import { expect, test } from "bun:test";
import { formatHours } from "./format";

test("a split shift stays on its day's row, so no day shows twice", () => {
  const rows = formatHours(
    [
      { from: 1, to: 5, open: "10:00", close: "20:00" },
      { from: 6, to: 6, open: "10:00", close: "14:00" },
      { from: 6, to: 6, open: "15:00", close: "20:00" },
    ],
    "es",
  );
  expect(rows.map((r) => r.days)).toEqual(["lunes – viernes", "sábado"]);
  expect(rows[1]?.time.split(", ")).toHaveLength(2);
  expect(new Set(rows.map((r) => r.days)).size).toBe(rows.length);
});
