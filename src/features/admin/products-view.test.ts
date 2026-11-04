import { expect, test } from "bun:test";
import {
  categoriesOf,
  inCategory,
  parseStock,
  stockAlerts,
  stockChanges,
  stockState,
} from "./products-view";

test("tells out, low and fine apart", () => {
  expect(stockState(0)).toBe("out");
  expect(stockState(3)).toBe("low");
  expect(stockState(4)).toBe("ok");
});

test("alerts count each active, counted product once, at its worst", () => {
  const products = [
    { active: true, stock: [{ quantity: 0 }, { quantity: 9 }] },
    { active: true, stock: [{ quantity: 2 }] },
    { active: true, stock: [] },
    { active: false, stock: [{ quantity: 0 }] },
    { active: true, stock: [{ quantity: 1 }, { quantity: 0 }] },
  ];
  expect(stockAlerts(products)).toEqual({ out: 2, low: 1 });
});

test("categories once each, whatever the case, sorted", () => {
  expect(
    categoriesOf([
      { category: "Ceras" },
      { category: "barba" },
      { category: "ceras " },
      {},
      { category: "Barba" },
    ]),
  ).toEqual(["barba", "Ceras"]);
  expect(inCategory({ category: "Ceras" }, "ceras")).toBe(true);
  expect(inCategory({ category: "Ceras" }, "")).toBe(true);
  expect(inCategory({}, "Ceras")).toBe(false);
});

test("an empty box means not counted; digits only otherwise", () => {
  expect(parseStock("")).toBeNull();
  expect(parseStock("12")).toBe(12);
  expect(parseStock("1a2")).toBe(12);
});

test("only the branches that changed are saved", () => {
  expect(
    stockChanges(
      [
        { branchId: "a", quantity: 5 },
        { branchId: "b", quantity: 2 },
      ],
      { a: 5, b: 3, c: null, d: 0 },
    ),
  ).toEqual([
    { branchId: "b", quantity: 3 },
    { branchId: "d", quantity: 0 },
  ]);
  // Not counting any more is a change too.
  expect(stockChanges([{ branchId: "a", quantity: 5 }], { a: null })).toEqual([
    { branchId: "a", quantity: null },
  ]);
});
