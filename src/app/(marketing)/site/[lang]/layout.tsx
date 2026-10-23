import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { marketingUrl } from "@/shared/api/marketing-host";
import { getLandingDictionary } from "@/shared/i18n/landing";
import { hasLocale, locales } from "@/shared/i18n/locales";
import "./landing.css";

/**
 * Root layout of the marketing site (brb-studio itself). Never touches a tenant: no getTenant, no
 * tenant theme. Reached only through the proxy rewrite on MARKETING_HOSTS (/{lang} → /site/{lang}).
 * Static: MARKETING_* env vars are read at build time.
 */

const sans = Geist({ subsets: ["latin"], variable: "--font-geist" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
  variable: "--font-fraunces",
});

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: "#0e0d0c",
  colorScheme: "dark",
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getLandingDictionary();
  return {
    metadataBase: marketingUrl(),
    title: { default: t.meta.title, template: "%s" },
    description: t.meta.description,
    applicationName: "brb-studio",
    openGraph: { siteName: "brb-studio", type: "website" },
    twitter: { card: "summary_large_image" },
    icons: { icon: "/landing/mark.svg" },
    formatDetection: { telephone: false },
  };
}

export default async function MarketingLayout({
  children,
  params,
}: LayoutProps<"/site/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html
      lang={lang}
      className={`${sans.variable} ${mono.variable} ${display.variable}`}
    >
      <body className="lp-body-root">{children}</body>
    </html>
  );
}
