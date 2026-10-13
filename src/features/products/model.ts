import { queryOptions } from "@tanstack/react-query";
import * as z from "zod";
import { localized } from "@/shared/i18n/localized";

export const catalogSchema = z.object({
  currency: z.string(),
  products: z.array(
    z.object({
      slug: z.string(),
      name: localized,
      description: localized.optional(),
      priceMinor: z.number().int(),
      category: z.string().optional(),
      image: z.string().optional(),
      images: z.array(z.string()).default([]),
      available: z.boolean(),
    }),
  ),
});
export type Catalog = z.output<typeof catalogSchema>;

export const orderSchema = z.object({
  id: z.string(),
  status: z.enum(["reserved", "delivered", "cancelled", "expired"]),
  code: z.string().optional(),
  branch: z.object({ slug: z.string(), name: z.string() }).optional(),
  items: z.array(
    z.object({
      name: localized,
      priceMinor: z.number().int(),
      quantity: z.number().int(),
    }),
  ),
  currency: z.string(),
  totalMinor: z.number().int(),
  expiresAt: z.string(),
});
export type ProductOrder = z.output<typeof orderSchema>;

export const myOrdersSchema = z.object({
  transfer: z.object({ accountKey: z.string(), holder: z.string() }).nullable(),
  orders: z.array(orderSchema),
});

export const myOrdersKey = ["me", "product-orders"] as const;

export const myOrdersQuery = () =>
  queryOptions({
    queryKey: myOrdersKey,
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/me/product-orders", { signal });
      if (!response.ok) throw new Error(`product orders ${response.status}`);
      return myOrdersSchema.parse(await response.json());
    },
    staleTime: 15_000,
  });
