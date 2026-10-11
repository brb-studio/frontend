import { cache } from "react";
import { ApiError, backend } from "@/shared/api/backend";
import { staffSchema } from "./model";

/** The signed-in platform staff member, or null (no cookie, expired or revoked session). */
export const getPlatformStaff = cache(async () => {
  try {
    return (await backend("/platform/auth/me", staffSchema, { platform: true }))
      .staff;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});
