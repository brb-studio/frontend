import { expect, test } from "bun:test";
import { owedFirst, payRange, payTotals } from "./pay-view";

test("the fortnight is the 1st–15th or the 16th–today", () => {
  expect(payRange("fortnight", "2026-11-03")).toEqual({
    from: "2026-11-01",
    to: "2026-11-03",
  });
  expect(payRange("fortnight", "2026-11-20")).toEqual({
    from: "2026-11-16",
    to: "2026-11-20",
  });
  // The other periods are the revenue page's own.
  expect(payRange("month", "2026-11-20")).toEqual({
    from: "2026-11-01",
    to: "2026-11-20",
  });
});

const row = (
  name: string,
  commission: number,
  paidOut: number,
  unconfigured = 0,
) => ({
  name,
  commission,
  paidOut,
  pending: commission - paidOut,
  unconfigured,
});

test("totals across barbers, with who is owed and who has no rate", () => {
  expect(
    payTotals([
      row("Ana", 500, 200),
      row("Beto", 300, 300),
      row("Caro", 0, 0, 4),
    ]),
  ).toEqual({
    commission: 800,
    paidOut: 500,
    pending: 300,
    owed: 1,
    unconfigured: ["Caro"],
  });
});

test("whoever is owed most comes first", () => {
  expect(
    owedFirst([
      row("Beto", 300, 300),
      row("Ana", 500, 200),
      row("Caro", 900, 100),
    ]).map((r) => r.name),
  ).toEqual(["Caro", "Ana", "Beto"]);
});
