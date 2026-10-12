"use server";

import * as z from "zod";
import { ApiError, backend } from "@/shared/api/backend";
import {
  type Checkout,
  checkoutSchema,
  ONLINE_METHODS,
  PAYMENT_KINDS,
} from "./model";

export type PaymentError =
  | "transferTooLate"
  | "alreadyPaid"
  | "notPending"
  | "unavailable"
  | "rateLimited";

export type SwitchResult =
  | { ok: true; checkout: Checkout }
  | { ok: false; error: PaymentError };

const input = z.object({
  appointmentId: z.string().regex(/^[a-f\d]{24}$/),
  kind: z.enum(PAYMENT_KINDS),
  method: z.enum(ONLINE_METHODS),
  paymentToken: z
    .string()
    .regex(/^[\w-]{1,64}$/)
    .optional(),
});

function paymentErrorOf(error: unknown): PaymentError {
  if (!(error instanceof ApiError)) return "unavailable";
  switch (error.code) {
    case "TRANSFER_TOO_LATE":
      return "transferTooLate";
    case "ALREADY_PAID":
      return "alreadyPaid";
    case "NOT_PENDING_PAYMENT":
      return "notPending";
    case "RATE_LIMITED":
      return "rateLimited";
    default:
      return "unavailable";
  }
}

/** Changes card ↔ transfer (or deposit ↔ full) while the booking still waits; same deadline. */
export async function switchPayment(
  raw: z.input<typeof input>,
): Promise<SwitchResult> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "unavailable" };
  const { appointmentId, ...body } = parsed.data;
  try {
    const checkout = await backend(
      `/v1/public/appointments/${appointmentId}/payment`,
      checkoutSchema,
      { method: "POST", body },
    );
    return { ok: true, checkout };
  } catch (error) {
    return { ok: false, error: paymentErrorOf(error) };
  }
}
