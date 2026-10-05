"use server";

import * as z from "zod";
import { ApiError, backend } from "@/shared/api/backend";

export type CancelResult =
  | { ok: true }
  | { ok: false; error: "tooLate" | "unavailable" };

export type RescheduleResult =
  | { ok: true }
  | {
      ok: false;
      error: "tooLate" | "slotTaken" | "barberUnavailable" | "unavailable";
    };

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
export async function rescheduleAppointment(
  id: string,
  startAt: string,
): Promise<RescheduleResult> {
  if (!/^[a-f\d]{24}$/.test(id)) return { ok: false, error: "unavailable" };
  try {
    await backend(`/v1/me/appointments/${id}/reschedule`, z.unknown(), {
      method: "POST",
      body: { startAt },
    });
    return { ok: true };
  } catch (error) {
    if (!(error instanceof ApiError))
      return { ok: false, error: "unavailable" };
    switch (error.code) {
      case "TOO_LATE":
        return { ok: false, error: "tooLate" };
      case "SLOT_TAKEN":
        return { ok: false, error: "slotTaken" };
      case "BARBER_UNAVAILABLE":
        return { ok: false, error: "barberUnavailable" };
      default:
        return { ok: false, error: "unavailable" };
    }
  }
}
