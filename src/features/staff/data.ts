import * as z from "zod";
import { appointmentSchema } from "@/features/account/model";
import { ApiError, backend } from "@/shared/api/backend";
import { notificationsSchema } from "./model";

const DAY_MS = 24 * 60 * 60 * 1000;

/** From now until 7 days ahead. */
export function getAgenda() {
  const from = new Date();
  const to = new Date(from.getTime() + 7 * DAY_MS);
  return backend(
    `/v1/appointments?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
    z.array(appointmentSchema),
  );
}

export const getNotifications = () =>
  backend("/v1/notifications", notificationsSchema);

/** The VAPID key phones need to subscribe, or null when push isn't configured on the API. */
export async function getPushKey() {
  try {
    return (
      await backend(
        "/v1/notifications/push-key",
        z.object({ publicKey: z.string() }),
      )
    ).publicKey;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
