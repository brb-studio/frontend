"use server";

import * as z from "zod";
import { ApiError, backend } from "@/shared/api/backend";
import { DAY_PARTS } from "./model";

const slug = z
  .string()
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const joinInput = z.object({
  branch: slug,
  kind: z.enum(["service", "package"]),
  slug,
  date: z.iso.date(),
  part: z.enum(["any", "morning", "afternoon"]),
});

export type JoinError =
  | "invalid"
  | "slotsAvailable"
  | "full"
  | "already"
  | "signIn"
  | "unavailable";

export type JoinResult = { ok: true } | { ok: false; error: JoinError };

export async function joinWaitlist(
  input: z.input<typeof joinInput>,
): Promise<JoinResult> {
  const parsed = joinInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { kind, slug: item, part, ...rest } = parsed.data;
  try {
    await backend("/v1/me/waitlist", z.unknown(), {
      method: "POST",
      body: { ...rest, [kind]: item, ...DAY_PARTS[part] },
    });
    return { ok: true };
  } catch (error) {
    if (!(error instanceof ApiError))
      return { ok: false, error: "unavailable" };
    if (error.status === 401) return { ok: false, error: "signIn" };
    switch (error.code) {
      case "SLOTS_AVAILABLE":
        return { ok: false, error: "slotsAvailable" };
      case "WAITLIST_FULL":
        return { ok: false, error: "full" };
      case "ALREADY_WAITING":
        return { ok: false, error: "already" };
      case "VALIDATION":
        return { ok: false, error: "invalid" };
      default:
        return { ok: false, error: "unavailable" };
    }
  }
}

export async function leaveWaitlist(id: string): Promise<{ ok: boolean }> {
  if (!/^[a-f\d]{24}$/.test(id)) return { ok: false };
  try {
    await backend(`/v1/me/waitlist/${id}`, z.undefined(), { method: "DELETE" });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
