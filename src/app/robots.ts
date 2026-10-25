import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import {
  isMarketingHost,
  marketingUrl,
  requestHostOf,
} from "@/shared/api/marketing-host";
import { locales } from "@/shared/i18n/locales";

/** Host-aware: the marketing site is fully crawlable; a barbershop keeps its panels out of search. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  if (isMarketingHost(requestHostOf(await headers()))) {
    return {
      rules: { userAgent: "*", allow: "/" },
      sitemap: new URL("/sitemap.xml", marketingUrl()).toString(),
    };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        ...locales.flatMap((l) => [
          `/${l}/admin`,
          `/${l}/platform`,
          `/${l}/account`,
          `/${l}/pay/`,
        ]),
      ],
    },
  };
}
