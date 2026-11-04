import { expect, test } from "bun:test";
import { searchTerm, splitMatch } from "./search";

test("searches only once there is enough to match", () => {
  expect(searchTerm("a")).toBe("");
  expect(searchTerm("  an ")).toBe("an");
  expect(searchTerm("Ana   López")).toBe("Ana López");
  expect(searchTerm("66")).toBe("");
  expect(searchTerm("664")).toBe("664");
  expect(searchTerm("(664) 1")).toBe("(664) 1");
  expect(searchTerm("")).toBe("");
});

test("marks the match without losing the original case", () => {
  expect(splitMatch("Ana López", "lóp")).toEqual([
    { text: "Ana ", hit: false },
    { text: "Lóp", hit: true },
    { text: "ez", hit: false },
  ]);
  expect(splitMatch("Ana", "ana")).toEqual([{ text: "Ana", hit: true }]);
  // Accents count, as in the API.
  expect(splitMatch("Ana López", "lop")).toEqual([
    { text: "Ana López", hit: false },
  ]);
  expect(splitMatch("Ana", "")).toEqual([{ text: "Ana", hit: false }]);
});
