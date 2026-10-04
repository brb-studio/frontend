import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { notFound } from "next/navigation";
import { getTenant } from "@/entities/tenant/api";
import { themeColors, themeCss } from "@/entities/tenant/theme";
import { getDictionary } from "@/shared/i18n/dictionary";
import { hasLocale, locales } from "@/shared/i18n/locales";
import "../globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist" });

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateViewport(): Promise<Viewport> {
  const { light, dark } = themeColors((await getTenant()).theme);
  return {
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: light },
      { media: "(prefers-color-scheme: dark)", color: dark },
    ],
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const [{ meta }, tenant] = await Promise.all([getDictionary(), getTenant()]);
  return {
    metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
    title: { default: tenant.name, template: `%s · ${tenant.name}` },
    description: meta.description,
    openGraph: { siteName: tenant.name, type: "website" },
    // Opens full screen from the iPhone home screen, which iOS requires for push notifications.
    appleWebApp: {
      capable: true,
      title: tenant.name,
      statusBarStyle: "black-translucent",
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const css = themeCss((await getTenant()).theme);

  return (
    <html lang={lang} className={sans.variable}>
      <head>{css ? <style>{css}</style> : null}</head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
