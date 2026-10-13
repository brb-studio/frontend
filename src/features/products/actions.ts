"use server";

import * as z from "zod";
import { ApiError, backend } from "@/shared/api/backend";

const slug = z
  .string()
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const reserveInput = z.object({
  branch: slug,
  items: z
    .array(z.object({ product: slug, quantity: z.int().min(1).max(20) }))
    .min(1)
    .max(10),
});

export type ReserveError =
  | "invalid"
  | "outOfStock"
  | "tooMany"
  | "signIn"
  | "unavailable";

export type ReserveResult = { ok: true } | { ok: false; error: ReserveError };

export async function reserveProducts(
  input: z.input<typeof reserveInput>,
): Promise<ReserveResult> {
  const parsed = reserveInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    await backend("/v1/me/product-orders", z.unknown(), {
      method: "POST",
      body: parsed.data,
    });
    return { ok: true };
  } catch (error) {
    if (!(error instanceof ApiError))
      return { ok: false, error: "unavailable" };
    if (error.status === 401) return { ok: false, error: "signIn" };
    switch (error.code) {
      case "OUT_OF_STOCK":
        return { ok: false, error: "outOfStock" };
      case "TOO_MANY_RESERVATIONS":
        return { ok: false, error: "tooMany" };
      case "VALIDATION":
      case "NOT_FOUND":
        return { ok: false, error: "invalid" };
      default:
        return { ok: false, error: "unavailable" };
    }
  }
}

export async function cancelProductOrder(id: string): Promise<{ ok: boolean }> {
  if (!/^[a-f\d]{24}$/.test(id)) return { ok: false };
  try {
    await backend(`/v1/me/product-orders/${id}/cancel`, z.undefined(), {
      method: "POST",
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
