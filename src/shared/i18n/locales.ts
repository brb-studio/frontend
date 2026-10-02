export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

export const alternates = (locale: Locale, path: string) => ({
  canonical: `/${locale}${path}`,
  languages: Object.fromEntries([
    ...locales.map((l) => [l, `/${l}${path}`]),
    ["x-default", path || "/"],
  ]) as Record<Locale | "x-default", string>,
});

export function matchLocale(acceptLanguage: string | null): Locale {
  const ranked = (acceptLanguage ?? "")
    .split(",")
    .map((entry) => {
      const [tag = "", ...params] = entry.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return {
        language: tag.split("-")[0]?.toLowerCase() ?? "",
        q: q ? Number(q.slice(2)) : 1,
      };
    })
    .filter((entry) => entry.q > 0)
    .sort((a, b) => b.q - a.q);

  return ranked.map((entry) => entry.language).find(hasLocale) ?? defaultLocale;
}
