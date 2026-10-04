import * as z from "zod";
import type { Locale } from "./locales";

/** Text the API stores per language. */
export const localized = z.object({
  es: z.string().optional(),
  en: z.string().optional(),
});
export type Localized = z.output<typeof localized>;

/** The text in this locale, falling back to the other one. */
export const pick = (text: Localized | undefined, locale: Locale) =>
  text?.[locale] ?? text?.es ?? text?.en ?? "";
