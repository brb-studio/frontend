import { cache } from "react";
import * as z from "zod";
import { backend } from "@/shared/api/backend";
import type { Locale } from "@/shared/i18n/locales";
import { localized, pick } from "@/shared/i18n/localized";

export type Service = {
  kind: "service" | "package";
  slug: string;
  name: string;
  description: string;
  durationMin: number;

  image: string;

  images: string[];

  price: number;

  listPrice?: number;

  includes?: string[];
};

const item = {
  slug: z.string(),
  name: localized,
  description: localized.optional(),
  durationMin: z.number().int(),
  priceMinor: z.number().int(),
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
};
const apiCatalog = z.object({
  currency: z.string(),
  services: z.array(z.object(item)),
  packages: z.array(
    z.object({
      ...item,
      listPriceMinor: z.number().int(),
      services: z.array(z.object({ slug: z.string(), name: localized })),
    }),
  ),
});

const FALLBACK_IMAGE = "/images/sample/haircut.jpg";

export function toServices(
  api: z.output<typeof apiCatalog>,
  locale: Locale,
): Service[] {
  const base = (s: z.output<typeof apiCatalog>["services"][number]) => ({
    slug: s.slug,
    name: pick(s.name, locale),
    description: pick(s.description, locale),
    durationMin: s.durationMin,
    image: s.image ?? FALLBACK_IMAGE,
    images: s.images?.length ? s.images : [s.image ?? FALLBACK_IMAGE],
    price: s.priceMinor,
  });
  return [
    ...api.services.map((s) => ({ ...base(s), kind: "service" as const })),
    ...api.packages.map((p) => ({
      ...base(p),
      kind: "package" as const,
      listPrice: p.listPriceMinor,
      includes: p.services.map((s) => pick(s.name, locale)),
    })),
  ];
}

export const getServices = cache(async (locale: Locale) =>
  toServices(await backend("/v1/public/catalog", apiCatalog), locale),
);

export async function getService(slug: string, locale: Locale) {
  return (await getServices(locale)).find((service) => service.slug === slug);
}
