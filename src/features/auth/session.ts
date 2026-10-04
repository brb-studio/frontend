import { cache } from "react";
import * as z from "zod";
import { ApiError, backend, sessionToken } from "@/shared/api/backend";

const me = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string().optional(),
    role: z.enum(["owner", "admin", "manager", "barber", "customer"]),
    branchId: z.string().optional(),
  }),
});

export type SessionUser = z.output<typeof me>["user"];

/** Who is signed in on this request, or null. An expired or revoked token is just signed out. */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  if (!(await sessionToken())) return null;
  try {
    return (await backend("/v1/auth/me", me)).user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});

export const isStaff = (user: SessionUser | null) =>
  !!user && user.role !== "customer";
