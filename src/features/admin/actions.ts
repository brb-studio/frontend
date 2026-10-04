"use server";

import * as z from "zod";
import { ApiError, backend, type Issue } from "@/shared/api/backend";
import { isAdminPath } from "./paths";

export type AdminResult =
  | { ok: true; data: unknown }
  | { ok: false; code: string; message: string; issues: Issue[] };

const request = z.object({
  method: z.enum(["POST", "PATCH", "DELETE"]),
  path: z.string().max(200).refine(isAdminPath),
  body: z.unknown().optional(),
});

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 1024 * 1024;

export type UploadResult =
  | { ok: true; path: string }
  | { ok: false; code: string; message: string };

/** One photo (already shrunk in the browser) to the API; returns the path to store in `image`. */
export async function uploadImage(form: FormData): Promise<UploadResult> {
  const file = form.get("file");
  if (
    !(file instanceof File) ||
    !IMAGE_TYPES.has(file.type) ||
    file.size > MAX_IMAGE_BYTES
  ) {
    return { ok: false, code: "UNSUPPORTED_IMAGE", message: "Invalid image" };
  }
  try {
    const { id } = await backend(
      "/v1/images",
      z.object({ id: z.string().regex(/^[\w-]{22}$/) }),
      { method: "POST", body: file },
    );
    return { ok: true, path: `/api/images/${id}` };
  } catch (error) {
    return error instanceof ApiError
      ? { ok: false, code: error.code, message: error.message }
      : { ok: false, code: "UNAVAILABLE", message: "Unavailable" };
  }
}

/**
 * Every admin write goes through here: an allow-listed staff path, the session from the httpOnly
 * cookie, and the API's answer back as a value (field issues included) so forms can show it.
 */
export async function adminRequest(
  input: z.input<typeof request>,
): Promise<AdminResult> {
  const parsed = request.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION",
      message: "Invalid request",
      issues: [],
    };
  }
  const { method, path, body } = parsed.data;
  try {
    const data = await backend(`/v1/${path}`, z.unknown(), { method, body });
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        ok: false,
        code: error.code,
        message: error.message,
        issues: error.issues,
      };
    }
    return {
      ok: false,
      code: "UNAVAILABLE",
      message: "Unavailable",
      issues: [],
    };
  }
}
