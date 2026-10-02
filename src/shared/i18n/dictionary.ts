import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import en, { type Dictionary } from "./en";
import es from "./es";
import { hasLocale, type Locale } from "./locales";

const dictionaries: Record<Locale, Dictionary> = { es, en };

export async function getLocale(): Promise<Locale> {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  return locale;
}

export async function getDictionary() {
  return dictionaries[await getLocale()];
}
