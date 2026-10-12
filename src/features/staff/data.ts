import * as z from "zod";
import { appointmentSchema } from "@/features/account/model";
import { ApiError, backend } from "@/shared/api/backend";
import { notificationsSchema } from "./model";

const DAY_MS = 24 * 60 * 60 * 1000;

export function getAgenda() {
  const from = new Date();
  const to = new Date(from.getTime() + 7 * DAY_MS);
  return backend(
    `/v1/appointments?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
    z.array(appointmentSchema),
  );
}

export const getNotifications = (page: string, pageSize: string) =>
  backend(
    `/v1/notifications?page=${encodeURIComponent(page)}&pageSize=${encodeURIComponent(pageSize)}`,
    notificationsSchema,
  );

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
