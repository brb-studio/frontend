import type { MetadataRoute } from "next";
import { getTenant } from "@/entities/tenant/api";

/** Each tenant installs as its own app: its name and colors, opening full screen like a native app. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
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
