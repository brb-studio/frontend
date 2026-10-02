import { expect, test } from "bun:test";
import { themeColors, themeCss } from "./theme";

test("no theme keeps the defaults", () => {
  expect(themeCss()).toBe("");
  expect(themeColors()).toEqual({ light: "#ffffff", dark: "#050505" });
});

test("a string applies to both schemes, a pair swaps", () => {
  expect(
    themeCss({
      accent: "#2563eb",
      canvas: { light: "#f5f0e6", dark: "#1c1c1c" },
    }),
  ).toBe(
    ":root{--color-accent:#2563eb;--color-canvas:light-dark(#f5f0e6,#1c1c1c)}",
  );
  expect(
    themeColors({ canvas: { light: "#f5f0e6", dark: "#1c1c1c" } }),
  ).toEqual({
    light: "#f5f0e6",
    dark: "#1c1c1c",
  });
});

test("drops unknown tokens and anything that is not a color", () => {
  expect(themeCss({ accent: "red;}body{display:none" })).toBe("");
  // @ts-expect-error unknown token
  expect(themeCss({ evil: "#000" })).toBe("");
  expect(
    themeCss({ canvas: { light: "#fff", dark: "</style><script>" } }),
  ).toBe("");
});
