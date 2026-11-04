import { expect, test } from "bun:test";
import {
  filterCatalog,
  formatDuration,
  moveTo,
  offeredBy,
  packageTotals,
  savingsOf,
} from "./catalog-view";

const text = {
  minutes: "{m} min",
  hours: "{h} h",
  hoursMinutes: "{h} h {m} min",
};

test("durations read like people say them", () => {
  expect(formatDuration(45, text)).toBe("45 min");
  expect(formatDuration(60, text)).toBe("1 h");
  expect(formatDuration(90, text)).toBe("1 h 30 min");
});

test("counts only active barbers who do the service", () => {
  const barbers = [
    { active: true, serviceIds: ["cut", "beard"] },
    { active: true, serviceIds: ["beard"] },
    { active: false, serviceIds: ["cut"] },
  ];
  expect(offeredBy("cut", barbers)).toBe(1);
  expect(offeredBy("shave", barbers)).toBe(0);
});

test("a package saves the difference, never a negative amount", () => {
  expect(savingsOf({ priceMinor: 38_000, listPriceMinor: 43_000 })).toBe(5_000);
  expect(savingsOf({ priceMinor: 50_000, listPriceMinor: 43_000 })).toBe(0);
  expect(savingsOf({ priceMinor: 50_000, listPriceMinor: null })).toBe(0);
});

test("filters by status and by name, ignoring accents and case", () => {
  const items = [
    { id: "a", active: true, name: { es: "Córte clásico" } },
    { id: "b", active: false, name: { es: "Barba", en: "Beard" } },
    { id: "c", active: true, name: { es: "Afeitado" } },
  ];
  const ids = (list: { id: string }[]) => list.map((i) => i.id);
  expect(ids(filterCatalog(items, "active", ""))).toEqual(["a", "c"]);
  expect(ids(filterCatalog(items, "inactive", ""))).toEqual(["b"]);
  expect(ids(filterCatalog(items, "all", "corte"))).toEqual(["a"]);
  expect(ids(filterCatalog(items, "all", "BEARD"))).toEqual(["b"]);
});

test("moving swaps neighbours and only saves what changed", () => {
  const items = [
    { id: "a", position: 0 },
    { id: "b", position: 1 },
    { id: "c", position: 2 },
  ];
  expect(moveTo(items, "c", -1)).toEqual([
    { id: "c", position: 1 },
    { id: "b", position: 2 },
  ]);
  expect(moveTo(items, "a", -1)).toEqual([]);
  expect(moveTo(items, "c", 1)).toEqual([]);
});

test("moving works even when positions repeat", () => {
  const items = [
    { id: "a", position: 0 },
    { id: "b", position: 0 },
    { id: "c", position: 0 },
  ];
  expect(moveTo(items, "c", -1)).toEqual([
    { id: "c", position: 1 },
    { id: "b", position: 2 },
  ]);
});

test("a package's live totals add the chosen services", () => {
  const services = [
    { id: "cut", durationMin: 45, priceMinor: 25_000 },
    { id: "beard", durationMin: 30, priceMinor: 18_000 },
    { id: "fade", durationMin: 50, priceMinor: 30_000 },
  ];
  expect(packageTotals(["cut", "beard"], services)).toEqual({
    durationMin: 75,
    listPriceMinor: 43_000,
  });
});
