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
  | "emailNotVerified"
  | "rateLimited"
  | "invalidToken"
  | "wrongPassword"
  | "openBookings"
  | "terms";

const email = z
  .string({ error: "required" })
  .trim()
  .pipe(z.email({ error: "email" }));

const password = z
  .string({ error: "required" })
  .min(8, { error: "passwordMin" })
  .max(128, { error: "passwordMax" });

export const loginSchema = z.object({ email, password });

export const forgotSchema = z.object({ email });

export const resetSchema = z.object({
  token: z.string({ error: "invalidToken" }).min(1, { error: "invalidToken" }),
  password,
});

export const tokenSchema = z.object({
  token: z.string({ error: "invalidToken" }).min(1, { error: "invalidToken" }),
});

export const passwordChangeSchema = z.object({
  currentPassword: z
    .string({ error: "required" })
    .min(1, { error: "required" })
    .max(128, { error: "passwordMax" }),
  newPassword: password,
});

export const deleteAccountSchema = z.object({
  password: z
    .string({ error: "required" })
    .min(1, { error: "required" })
    .max(128, { error: "passwordMax" }),
});

const name = z
  .string({ error: "required" })
  .trim()
  .min(2, { error: "name" })
  .max(80, { error: "name" });

const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{7,20}$/, { error: "phone" })
  .or(z.literal(""))
  .default("");

export const registerSchema = z.object({
  name,
  email,
  phone,
  password,
  acceptTerms: z.literal("true", { error: "terms" }),
});

export const profileSchema = z.object({ name, phone });

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
