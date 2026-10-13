import { queryOptions } from "@tanstack/react-query";
import * as z from "zod";
import { localized } from "@/shared/i18n/localized";

export const waitlistEntrySchema = z.object({
  id: z.string(),
  branch: z.object({ slug: z.string(), name: z.string() }),
  item: z.object({
    kind: z.enum(["service", "package"]),
    slug: z.string(),
    name: localized,
  }),
  date: z.string(),
  from: z.string().optional(),
  to: z.string().optional(),
  status: z.enum(["waiting", "notified"]),
});
export type WaitlistEntry = z.output<typeof waitlistEntrySchema>;

export const waitlistSchema = z.array(waitlistEntrySchema);

export const myWaitlistKey = ["me", "waitlist"] as const;

export const myWaitlistQuery = () =>
  queryOptions({
    queryKey: myWaitlistKey,
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/me/waitlist", { signal });
      if (!response.ok) throw new Error(`waitlist ${response.status}`);
      return waitlistSchema.parse(await response.json());
    },
    staleTime: 30_000,
  });

export const DAY_PARTS = {
  any: {},
  morning: { to: "12:59" },
  afternoon: { from: "13:00" },
} as const;
export type DayPart = keyof typeof DAY_PARTS;
