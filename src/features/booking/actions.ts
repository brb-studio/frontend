"use server";

import * as z from "zod";
import {
  checkoutSchema,
  ONLINE_METHODS,
  onlineQuoteSchema,
  PAYMENT_KINDS,
} from "@/features/payments/model";
import { ApiError, backend } from "@/shared/api/backend";

const slug = z
  .string()
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const target = {
  branch: slug,
  kind: z.enum(["service", "package"]),
  slug,
};
const code = z
  .string()
  .trim()
  .max(32)
  .transform((value) => value || undefined)
  .optional();

const bookingInput = z.object({
  ...target,
  barber: slug,
  startAt: z.iso.datetime({ offset: true }),
  code,
  payment: z
    .object({ kind: z.enum(PAYMENT_KINDS), method: z.enum(ONLINE_METHODS) })
    .optional(),
});

export type BookingError =
  | "invalid"
  | "signIn"
  | "slotTaken"
  | "barberUnavailable"
  | "promotion"
  | "rateLimited"
  | "paymentRequired"
  | "paymentUnavailable"
  | "transferTooLate"
  | "paymentProvider"
  | "unavailable";

export type BookingResult =
  | {
      ok: true;
      appointment: z.output<typeof booked>;
    }
  | { ok: false; error: BookingError };

export type QuoteResult =
  | ({ ok: true } & z.output<typeof quoted>)
  | { ok: false; error: BookingError };

function errorOf(error: unknown): BookingError {
  if (!(error instanceof ApiError)) return "unavailable";
  switch (error.code) {
    case "SLOT_TAKEN":
      return "slotTaken";
    case "BARBER_UNAVAILABLE":
      return "barberUnavailable";
    case "PROMOTION_UNAVAILABLE":
      return "promotion";
    case "VALIDATION":
      return "invalid";
    case "UNAUTHENTICATED":
    case "FORBIDDEN":
      return "signIn";
    case "RATE_LIMITED":
      return "rateLimited";
    case "PAYMENT_REQUIRED":
      return "paymentRequired";
    case "ONLINE_PAYMENT_UNAVAILABLE":
      return "paymentUnavailable";
    case "TRANSFER_TOO_LATE":
      return "transferTooLate";
    case "PAYMENT_PROVIDER_ERROR":
      return "paymentProvider";
    default:
      return "unavailable";
  }
}

const booked = z.object({
  id: z.string(),
  status: z.string(),
  totalMinor: z.number().int(),
  currency: z.string(),
  /** Present when the visit is being paid online: how to pay and until when the slot is held. */
  checkout: checkoutSchema.optional(),
});

export async function book(
  input: z.input<typeof bookingInput>,
): Promise<BookingResult> {
  const parsed = bookingInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { kind, slug: item, ...rest } = parsed.data;
  try {
    const appointment = await backend("/v1/public/appointments", booked, {
      method: "POST",
      body: { ...rest, [kind]: item },
    });
    return { ok: true, appointment };
  } catch (error) {
    return { ok: false, error: errorOf(error) };
  }
}

const quoteInput = z.object({
  ...target,
  code,
});
const quoted = z.object({
  subtotalMinor: z.number().int(),
  discountMinor: z.number().int(),
  totalMinor: z.number().int(),
  rejected: z.string().optional(),
  /** Shops with online payments: each option's charge and refund, computed by the API. */
  online: onlineQuoteSchema.optional(),
});

export async function quote(
  input: z.input<typeof quoteInput>,
): Promise<QuoteResult> {
  const parsed = quoteInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { kind, slug: item, ...rest } = parsed.data;
  try {
    return {
      ok: true,
      ...(await backend("/v1/public/quote", quoted, {
        method: "POST",
        body: { ...rest, [kind]: item },
      })),
    };
  } catch (error) {
    return { ok: false, error: errorOf(error) };
  }
}

const transferSchema = z.object({
  id: z.string(),
  appointmentId: z.string(),
  amountMinor: z.number().int(),
  currency: z.string(),
  holder: z.string(),
  clabe: z.string(),
  expiresAt: z.string(),
});

export type Transfer = z.output<typeof transferSchema>;

export type TransferResult =
  | { ok: true; transfer: Transfer }
  | {
      ok: false;
      error:
        | "notAvailable"
        | "alreadyPaid"
        | "nothingToCharge"
        | "rateLimited"
        | "unavailable";
    };

export async function createTransfer(
  appointmentId: string,
): Promise<TransferResult> {
  if (!/^[a-f\d]{24}$/.test(appointmentId))
    return { ok: false, error: "unavailable" };
  try {
    const transfer = await backend(
      "/v1/public/payments/transfer",
      transferSchema,
      {
        method: "POST",
        body: { appointmentId },
      },
    );
    return { ok: true, transfer };
  } catch (error) {
    if (!(error instanceof ApiError))
      return { ok: false, error: "unavailable" };
    switch (error.code) {
      case "TRANSFER_NOT_AVAILABLE":
        return { ok: false, error: "notAvailable" };
      case "ALREADY_PAID":
        return { ok: false, error: "alreadyPaid" };
      case "NOTHING_TO_CHARGE":
        return { ok: false, error: "nothingToCharge" };
      case "RATE_LIMITED":
        return { ok: false, error: "rateLimited" };
      default:
        return { ok: false, error: "unavailable" };
    }
  }
}
