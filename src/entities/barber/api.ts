import { cache } from "react";
import * as z from "zod";
import { backend } from "@/shared/api/backend";
import type { Locale } from "@/shared/i18n/locales";
import { localized, pick } from "@/shared/i18n/localized";

export type Barber = {
  slug: string;
  name: string;
  specialty: string;
  /** The branch's slug. */
  branch: string;
};

const apiBarbers = z.array(
  z.object({
    slug: z.string(),
    name: z.string(),
    specialty: localized.optional(),
    branch: z.string().optional(),
  }),
);

/** Active barbers of active branches. */
export const getBarbers = cache(
  async (locale: Locale): Promise<Barber[]> =>
    (await backend("/v1/public/barbers", apiBarbers)).map((b) => ({
      slug: b.slug,
      name: b.name,
      specialty: pick(b.specialty, locale),
      branch: b.branch ?? "",
    })),
);
