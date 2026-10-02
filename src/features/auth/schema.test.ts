import { expect, test } from "bun:test";
import { fieldErrors, loginSchema, registerSchema } from "./schema";

const errorsOf = (
  schema: typeof loginSchema | typeof registerSchema,
  input: object,
) => {
  const result = schema.safeParse(input);
  return result.success ? {} : fieldErrors(result.error);
};

test("login accepts a valid email and password, trimming the email", () => {
  const result = loginSchema.safeParse({
    email: "  a@b.co ",
    password: "12345678",
  });
  expect(result.success && result.data.email).toBe("a@b.co");
});

test("login reports error keys the dictionaries translate", () => {
  expect(errorsOf(loginSchema, { email: "nope", password: "short" })).toEqual({
    email: ["email"],
    password: ["passwordMin"],
  });
  expect(errorsOf(loginSchema, {})).toEqual({
    email: ["required"],
    password: ["required"],
  });
  expect(
    errorsOf(loginSchema, { email: "a@b.co", password: "x".repeat(129) }),
  ).toEqual({
    password: ["passwordMax"],
  });
});

test("register: phone is optional but must look like a phone when given", () => {
  const base = { name: "Ana", email: "ana@b.co", password: "12345678" };
  expect(registerSchema.safeParse({ ...base, phone: "" }).success).toBe(true);
  expect(registerSchema.safeParse(base).success).toBe(true);
  expect(
    registerSchema.safeParse({ ...base, phone: "+56 9 1234 5678" }).success,
  ).toBe(true);
  expect(errorsOf(registerSchema, { ...base, phone: "call me" })).toEqual({
    phone: ["phone"],
  });
  expect(errorsOf(registerSchema, { ...base, name: " A " })).toEqual({
    name: ["name"],
  });
});
