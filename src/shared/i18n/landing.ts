import { getLocale } from "./dictionary";
import landingEn, { type LandingDictionary } from "./landing-en";
import landingEs from "./landing-es";
import type { Locale } from "./locales";

const dictionaries: Record<Locale, LandingDictionary> = {
  es: landingEs,
  en: landingEn,
};

/** For code without root params (route handlers such as the OG image). */
export const landingDictionary = (locale: Locale) => dictionaries[locale];

export async function getLandingDictionary() {
  return dictionaries[await getLocale()];
}

/**
 * Identity of the marketing site's data controller (LFPDPPP art. 15). PENDING from the owner:
 * every `null` renders as a visible "Pending" placeholder and is a launch blocker.
 */
export const MARKETING_LEGAL: {
  name: string | null;
  address: string | null;
  privacyContact: string | null;
  updated: string;
} = {
  name: null,
  address: null,
  privacyContact: null,
  updated: "2026-10-23",
};

export type { LandingDictionary };
