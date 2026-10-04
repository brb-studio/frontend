import * as z from "zod";

export type ErrorKey =
  | "required"
  | "email"
  | "passwordMin"
  | "passwordMax"
  | "name"
  | "phone"
  | "unavailable"
  | "invalidCredentials"
  | "emailTaken"
  | "rateLimited"
  | "wrongPassword";

const email = z
  .string({ error: "required" })
  .trim()
  .pipe(z.email({ error: "email" }));

const password = z
  .string({ error: "required" })
  .min(8, { error: "passwordMin" })
  .max(128, { error: "passwordMax" });

export const loginSchema = z.object({ email, password });

export const passwordChangeSchema = z.object({
  currentPassword: z
    .string({ error: "required" })
    .min(1, { error: "required" })
    .max(128, { error: "passwordMax" }),
  newPassword: password,
});

export const registerSchema = z.object({
  name: z
    .string({ error: "required" })
    .trim()
    .min(2, { error: "name" })
    .max(80, { error: "name" }),
  email,
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, { error: "phone" })
    .or(z.literal(""))
    .default(""),
  password,
});

export type AuthState =
  | {
      errors?: Partial<Record<string, ErrorKey[]>>;
      formError?: ErrorKey;
      values?: Record<string, string>;
      done?: boolean;
    }
  | undefined;

export const fieldErrors = (error: z.ZodError) =>
  z.flattenError(error).fieldErrors as Partial<Record<string, ErrorKey[]>>;
