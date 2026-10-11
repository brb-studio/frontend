import * as z from "zod";
import type { Locale } from "./locales";

export const localized = z.object({
  es: z.string().optional(),
  en: z.string().optional(),
});
export type Localized = z.output<typeof localized>;

export const pick = (text: Localized | undefined, locale: Locale) =>
  text?.[locale] ?? text?.es ?? text?.en ?? "";
