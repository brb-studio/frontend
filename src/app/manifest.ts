import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getTenant } from "@/entities/tenant/api";
import { isMarketingHost, requestHostOf } from "@/shared/api/marketing-host";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // The marketing site is not an installable app: a plain browser manifest, no tenant lookup.
  if (isMarketingHost(requestHostOf(await headers()))) {
    return {
      name: "brb-studio",
      short_name: "brb-studio",
      display: "browser",
      background_color: "#0e0d0c",
      theme_color: "#0e0d0c",
    };
  }

  const tenant = await getTenant();
  const canvas = tenant.theme?.canvas;
  const background =
    typeof canvas === "string" ? canvas : (canvas?.dark ?? "#050505");
  return {
    name: tenant.name,
    short_name: tenant.name,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: background,
    theme_color: background,
    icons: [
      {
        src: "/pwa/icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
