import { expect, test } from "bun:test";
import {
  alternates,
  defaultLocale,
  hasLocale,
  type Locale,
  matchLocale,
} from "./locales";

test.each<[string | null, Locale]>([
  [null, defaultLocale],
  ["", defaultLocale],
  ["*", defaultLocale],
  ["de-DE,de;q=0.9", defaultLocale],
  ["es-CL,es;q=0.9,en;q=0.8", "es"],
  ["en-US,en;q=0.9,es;q=0.8", "en"],
  ["EN-gb", "en"],
  ["fr-FR,fr;q=0.9,en;q=0.7", "en"],
  ["en;q=0.2,es;q=0.9", "es"],
  ["es;q=0,en", "en"],
  ["es;q=abc,en;q=0.5", "en"],
])("matchLocale(%p) -> %p", (header, expected) => {
  expect(matchLocale(header)).toBe(expected);
});

test("hasLocale ignores Object.prototype keys", () => {
  expect(hasLocale("es")).toBe(true);
  expect(hasLocale("constructor")).toBe(false);
  expect(hasLocale("toString")).toBe(false);
});

test("alternates lists every locale plus an x-default", () => {
  expect(alternates("es", "/services")).toEqual({
    canonical: "/es/services",
    languages: {
      en: "/en/services",
      es: "/es/services",
      "x-default": "/services",
    },
  });
  expect(alternates("en", "").languages["x-default"]).toBe("/");
});
