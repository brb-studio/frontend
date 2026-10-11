import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import * as z from "zod";
import { localized } from "@/shared/i18n/localized";

export const STATUSES = [
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;
export type Status = (typeof STATUSES)[number];

const money = z.number().int();

export const totals = z.object({
  completed: z.number().int(),
  confirmed: z.number().int(),
  cancelled: z.number().int(),
  noShow: z.number().int(),
  sales: money,
  collected: money,
  commission: money,
  paidOut: money,
  pending: money,
  avgTicket: money,
  unconfigured: z.number().int(),
  lastAt: z.string().nullable(),
});

export const summarySchema = z.array(totals.extend({ currency: z.string() }));

const entity = totals.extend({
  id: z.string(),
  name: z.string(),
  currency: z.string(),
  tenantId: z.string().optional(),
  tenantName: z.string().optional(),
  active: z.boolean().optional(),
  activeBranches: z.number().int().optional(),
  activeBarbers: z.number().int().optional(),
  branchId: z.string().optional(),
  branchName: z.string().optional(),
  commissionBps: z.number().int().nullable().optional(),
});
export type Entity = z.output<typeof entity>;

const paged = <T extends z.ZodType>(row: T) =>
  z.object({ total: z.number().int(), rows: z.array(row) });

export const breakdownSchema = paged(entity);

export const commissionView = z.discriminatedUnion("state", [
  z.object({ state: z.literal("not_applicable") }),
  z.object({ state: z.literal("unconfigured") }),
  z.object({
    state: z.enum(["accrued", "paid"]),
    bps: z.number().int(),
    baseMinor: money,
    amountMinor: money,
    source: z.enum(["snapshot", "barber_config"]),
  }),
]);
export type CommissionView = z.output<typeof commissionView>;

export const cutRow = z.object({
  id: z.string(),
  startAt: z.string(),
  timeZone: z.string(),
  status: z.enum(STATUSES),
  tenantId: z.string(),
  tenantName: z.string(),
  branchId: z.string(),
  branchName: z.string(),
  barberId: z.string(),
  barberName: z.string(),
  items: z.array(z.object({ kind: z.string(), name: localized })),
  currency: z.string(),
  totalMinor: money,
  payment: z.object({ status: z.string() }).nullable(),
  commission: commissionView,
  payout: z.object({ id: z.string(), paidAt: z.string() }).nullable(),
});
export type CutRow = z.output<typeof cutRow>;

export const cutsSchema = paged(cutRow);

export const detailSchema = z.object({
  id: z.string(),
  status: z.enum(STATUSES),
  source: z.enum(["online", "staff"]),
  startAt: z.string(),
  endAt: z.string(),
  timeZone: z.string(),
  tenant: z.object({ id: z.string(), name: z.string() }),
  branch: z.object({ id: z.string(), name: z.string() }),
  barber: z.object({ id: z.string(), name: z.string() }),
  customer: z
    .object({
      name: z.string(),
      phone: z.string().nullable(),
      email: z.string().nullable(),
    })
    .nullable(),
  items: z.array(
    z.object({
      kind: z.string(),
      name: localized,
      durationMin: z.number(),
      priceMinor: money,
    }),
  ),
  notes: z.string().nullable(),
  cancelReason: z.string().nullable(),
  currency: z.string(),
  subtotalMinor: money,
  discountMinor: money,
  totalMinor: money,
  promotion: z
    .object({
      name: localized,
      code: z.string().nullable(),
      amountMinor: money,
    })
    .nullable(),
  payment: z
    .object({
      status: z.string(),
      amountMinor: money,
      applicationFeeMinor: money.nullable(),
      paidAt: z.string().nullable(),
    })
    .nullable(),
  commission: commissionView,
  payout: z
    .object({
      id: z.string(),
      paidAt: z.string(),
      amountMinor: money,
      reference: z.string().nullable(),
    })
    .nullable(),
  createdAt: z.string(),
});

export const optionsSchema = z.object({
  tenants: z.array(z.object({ id: z.string(), name: z.string() })),
  branches: z.array(z.object({ id: z.string(), name: z.string() })),
  barbers: z.array(z.object({ id: z.string(), name: z.string() })),
});

export const staffSchema = z.object({
  staff: z.object({ id: z.string(), name: z.string(), email: z.string() }),
});

export type Filters = {
  from: string;
  to: string;
  tenant?: string;
  branch?: string;
  barber?: string;
  status?: Status;
};

export type Level = "overview" | "tenant" | "branch" | "barber";

export const levelOf = (f: Filters): Level =>
  f.barber ? "barber" : f.branch ? "branch" : f.tenant ? "tenant" : "overview";

export const apiQuery = (
  f: Filters,
  extra: Record<string, string | number> = {},
) => {
  const q = new URLSearchParams({ from: f.from, to: f.to });
  if (f.tenant) q.set("tenantId", f.tenant);
  if (f.branch) q.set("branchId", f.branch);
  if (f.barber) q.set("barberId", f.barber);
  if (f.status) q.set("status", f.status);
  for (const [key, value] of Object.entries(extra)) q.set(key, String(value));
  return q.toString();
};

export class PlatformError extends Error {
  constructor(readonly status: number) {
    super(`platform ${status}`);
  }
}

export const platformQuery = <S extends z.ZodType>(path: string, schema: S) =>
  queryOptions({
    queryKey: ["platform", path],
    queryFn: async ({ signal }): Promise<z.output<S>> => {
      const response = await fetch(`/api/platform/${path}`, { signal });
      if (!response.ok) throw new PlatformError(response.status);
      return schema.parse(await response.json());
    },
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });

export const today = () => new Date().toLocaleDateString("en-CA");

export const daysAgo = (days: number) =>
  new Date(Date.now() - days * 864e5).toLocaleDateString("en-CA");

export const monthStart = () => `${today().slice(0, 7)}-01`;

export const SUBSCRIPTION_STATUSES = [
  "pending",
  "paid",
  "rejected",
  "expired",
] as const;

export const subscriptionRow = z.object({
  id: z.string(),
  status: z.enum(SUBSCRIPTION_STATUSES),
  amountMinor: z.number().int(),
  listPriceMinor: z.number().int(),
  currency: z.string(),
  expiresAt: z.string(),
  tenantName: z.string().nullable(),
  tenantSlug: z.string().nullable(),
  referralCode: z.string().optional(),
  reference: z.string().optional(),
  rejectionReason: z.string().optional(),
});
export type SubscriptionRow = z.output<typeof subscriptionRow>;
