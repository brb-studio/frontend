import { notFound } from "next/navigation";
import { cache } from "react";
import * as z from "zod";
import { ApiError, backend } from "@/shared/api/backend";
import { type TenantTheme, themeTokens } from "./theme";

/** Opening hours for a run of weekdays (0 = Sunday … 6 = Saturday), as the pages display them. */
export type Hours = { from: number; to: number; open: string; close: string };

export type Branch = {
  slug: string;
  name: string;
  address: string[];
  phone: string;
  phoneDisplay: string;
  mapsUrl: string;
  image: string;
  hours: Hours[];
  timeZone: string;
};

export type Tenant = {
  slug: string;
  name: string;
  currency: string;
  instagramUrl: string;
  authImage: string;
  coverImage: string;
  theme?: TenantTheme;
  paymentsOnline: boolean;
  branches: Branch[];
};

const color = z.string();
const apiHours = z.array(
  z.object({ weekday: z.number().int(), open: z.string(), close: z.string() }),
);
const apiTenant = z.object({
  slug: z.string(),
  name: z.string(),
  currency: z.string(),
  theme: z.partialRecord(
    z.enum(themeTokens),
    z.union([color, z.object({ light: color, dark: color })]),
  ),
  brand: z.object({
    instagramUrl: z.string().optional(),
    authImage: z.string().optional(),
    coverImage: z.string().optional(),
  }),
  payments: z.object({ online: z.boolean() }).optional(),
  branches: z.array(
    z.object({
      slug: z.string(),
      name: z.string(),
      address: z.array(z.string()),
      phone: z.string().optional(),
      mapsUrl: z.string().optional(),
      image: z.string().optional(),
      timeZone: z.string(),
      hours: apiHours,
    }),
  ),
});

const FALLBACK_IMAGE = "/images/sample/cover.jpg";
const WEEK = [1, 2, 3, 4, 5, 6, 0];

export function groupHours(hours: z.output<typeof apiHours>): Hours[] {
  const signature = (day: number) =>
    hours
      .filter((h) => h.weekday === day)
      .map((h) => `${h.open}-${h.close}`)
      .sort()
      .join(",");
  const runs: { from: number; to: number; key: string }[] = [];
  for (const day of WEEK) {
    const key = signature(day);
    const last = runs.at(-1);
    if (!key) continue;
    if (
      last &&
      last.key === key &&
      WEEK.indexOf(last.to) === WEEK.indexOf(day) - 1
    ) {
      last.to = day;
    } else {
      runs.push({ from: day, to: day, key });
    }
  }
  return runs.flatMap(({ from, to, key }) =>
    key.split(",").map((interval) => {
      const [open = "", close = ""] = interval.split("-");
      return { from, to, open, close };
    }),
  );
}

export function toTenant(api: z.output<typeof apiTenant>): Tenant {
  return {
    slug: api.slug,
    name: api.name,
    currency: api.currency,
    instagramUrl: api.brand.instagramUrl ?? "https://www.instagram.com/",
    authImage: api.brand.authImage ?? FALLBACK_IMAGE,
    coverImage: api.brand.coverImage ?? FALLBACK_IMAGE,
    theme: api.theme,
    paymentsOnline: api.payments?.online ?? false,
    branches: api.branches.map((b) => ({
      slug: b.slug,
      name: b.name,
      address: b.address,
      phone: b.phone ?? "",
      phoneDisplay: b.phone ?? "",
      mapsUrl:
        b.mapsUrl ??
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address.join(", "))}`,
      image: b.image ?? FALLBACK_IMAGE,
      hours: groupHours(b.hours),
      timeZone: b.timeZone,
    })),
  };
}

/** The tenant for this request's host. Deduplicated per request; an unknown host is a 404. */
export const getTenant = cache(async (): Promise<Tenant> => {
  try {
    return toTenant(await backend("/v1/public/tenant", apiTenant));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
});
