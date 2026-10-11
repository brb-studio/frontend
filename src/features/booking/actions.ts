"use server";

import * as z from "zod";
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
  customer: z
    .object({
      name: z.string().trim().min(2).max(80),
      phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9 ()-]{7,20}$/),
    })
    .optional(),
  code,
});

export type BookingError =
  | "invalid"
  | "slotTaken"
  | "barberUnavailable"
  | "promotion"
  | "rateLimited"
  | "unavailable";

export type BookingResult =
  | {
      ok: true;
      appointment: {
        id: string;
        totalMinor: number;
        currency: string;
        paymentToken?: string;
      };
    }
  | { ok: false; error: BookingError; fields?: ("name" | "phone")[] };

export type QuoteResult =
  | {
      ok: true;
      subtotalMinor: number;
      discountMinor: number;
      totalMinor: number;
      rejected?: string;
    }
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
    case "RATE_LIMITED":
      return "rateLimited";
    default:
      return "unavailable";
  }
}

const booked = z.object({
  id: z.string(),
  totalMinor: z.number().int(),
  currency: z.string(),

  paymentToken: z.string().optional(),
});

export async function book(
  input: z.input<typeof bookingInput>,
): Promise<BookingResult> {
  const parsed = bookingInput.safeParse(input);
  if (!parsed.success) {
    const fields = parsed.error.issues
      .map((issue) => issue.path[1])
      .filter(
        (field): field is "name" | "phone" =>
          field === "name" || field === "phone",
      );
    return { ok: false, error: "invalid", fields };
  }
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

const quoteInput = z.object({ ...target, code });
const quoted = z.object({
  subtotalMinor: z.number().int(),
  discountMinor: z.number().int(),
  totalMinor: z.number().int(),
  rejected: z.string().optional(),
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
  paymentToken?: string,
): Promise<TransferResult> {
  if (!/^[a-f\d]{24}$/.test(appointmentId))
    return { ok: false, error: "unavailable" };
  try {
    const transfer = await backend(
      "/v1/public/payments/transfer",
      transferSchema,
      {
        method: "POST",
        body: { appointmentId, ...(paymentToken && { paymentToken }) },
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
