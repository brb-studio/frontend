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
    ":root{--color-accent:#2563eb;--color-canvas:light-dark(#f5f0e6,#1c1c1c);--color-sheet:light-dark(color-mix(in srgb,#f5f0e6 96%,transparent),color-mix(in srgb,#1c1c1c 80%,transparent))}",
  );
  expect(
    themeColors({ canvas: { light: "#f5f0e6", dark: "#1c1c1c" } }),
  ).toEqual({
    light: "#f5f0e6",
    dark: "#1c1c1c",
  });
});

test("a barbershop's own sheet color wins over the one derived from its background", () => {
  expect(themeCss({ canvas: "#0b1220", sheet: "#123456" })).toBe(
    ":root{--color-canvas:#0b1220;--color-sheet:#123456}",
  );
});

test("drops unknown tokens and anything that is not a color", () => {
  expect(themeCss({ accent: "red;}body{display:none" })).toBe("");
  // @ts-expect-error unknown token
  expect(themeCss({ evil: "#000" })).toBe("");
  expect(
    themeCss({ canvas: { light: "#fff", dark: "</style><script>" } }),
  ).toBe("");
});
