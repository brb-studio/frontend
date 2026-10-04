"use server";

import * as z from "zod";
import { ApiError, backend } from "@/shared/api/backend";

export type CancelResult =
  | { ok: true }
  | { ok: false; error: "tooLate" | "unavailable" };

/** Cancels one of the signed-in customer's appointments; the API checks ownership and notice. */
export async function cancelAppointment(id: string): Promise<CancelResult> {
  if (!/^[a-f\d]{24}$/.test(id)) return { ok: false, error: "unavailable" };
  try {
    await backend(`/v1/me/appointments/${id}/cancel`, z.undefined(), {
      method: "POST",
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError && error.code === "TOO_LATE"
          ? "tooLate"
          : "unavailable",
    };
  }
}
