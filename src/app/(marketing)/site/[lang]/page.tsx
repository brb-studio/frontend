import type { Metadata } from "next";
import { marketingContact } from "@/shared/api/marketing-host";
import { getLocale } from "@/shared/i18n/dictionary";
import { getLandingDictionary } from "@/shared/i18n/landing";
import { alternates } from "@/shared/i18n/locales";
import { LandingPage } from "@/widgets/landing/landing-page";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getLandingDictionary(), getLocale()]);
  return {
    title: { absolute: t.meta.title },
    alternates: alternates(locale, ""),
    openGraph: {
      title: t.meta.title,
      description: t.meta.description,
      locale: locale === "es" ? "es_MX" : "en_US",
      url: `/${locale}`,
      siteName: "brb-studio",
      type: "website",
    },
  };
}

export default async function MarketingHome() {
  const [t, locale] = await Promise.all([getLandingDictionary(), getLocale()]);
  return <LandingPage locale={locale} t={t} contact={marketingContact()} />;
}
