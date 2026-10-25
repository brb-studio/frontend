import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import {
  isMarketingHost,
  marketingUrl,
  requestHostOf,
} from "@/shared/api/marketing-host";
import { locales } from "@/shared/i18n/locales";

const PAGES = ["", "/privacy"];

/** Only the marketing site publishes a sitemap; tenant hosts get an empty one. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isMarketingHost(requestHostOf(await headers()))) return [];
  const base = marketingUrl();
  const url = (path: string) => new URL(path, base).toString();
  return PAGES.flatMap((page) =>
    locales.map((locale) => ({
      url: url(`/${locale}${page}`),
      changeFrequency: "monthly" as const,
      priority: page === "" ? 1 : 0.3,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, url(`/${l}${page}`)]),
        ),
      },
    })),
  );
}
