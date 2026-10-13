import { backend } from "@/shared/api/backend";
import { catalogSchema, myOrdersSchema } from "./model";

export const getCatalog = (branch?: string) =>
  backend(
    `/v1/public/products${branch ? `?branch=${encodeURIComponent(branch)}` : ""}`,
    catalogSchema,
  );

export const getMyOrders = () =>
  backend("/v1/me/product-orders", myOrdersSchema);
