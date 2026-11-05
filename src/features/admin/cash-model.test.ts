import { expect, test } from "bun:test";
import { shiftDay, signed, toneOf } from "./cash-model";

test("moving between days crosses months and years", () => {
  expect(shiftDay("2026-11-30", 1)).toBe("2026-12-01");
  expect(shiftDay("2026-01-01", -1)).toBe("2025-12-31");
});

test("adjustments get their own tone; the rest follow the direction", () => {
  expect(toneOf({ direction: "in", type: "service_payment" })).toBe("in");
  expect(toneOf({ direction: "out", type: "refund" })).toBe("out");
  expect(toneOf({ direction: "out", type: "adjustment" })).toBe("adjust");
});

test("money out carries a real minus sign", () => {
  expect(signed("in", "$250.00")).toBe("+$250.00");
  expect(signed("out", "$600.00")).toBe("−$600.00");
});
