import { afterEach, expect, test } from "bun:test";
import { login, register } from "./actions";

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
};

const validLogin = {
  lang: "es",
  email: "ana@example.com",
  password: "supersecret",
};

afterEach(() => {
  delete process.env.AUTH_DEMO;
});

test("without AUTH_DEMO a valid login never enters the app", async () => {
  expect(await login(undefined, form(validLogin))).toEqual({
    formError: "unavailable",
    values: { email: "ana@example.com" },
  });
});

test("with AUTH_DEMO a valid login redirects to the app home", async () => {
  process.env.AUTH_DEMO = "true";
  await expect(login(undefined, form(validLogin))).rejects.toMatchObject({
    digest: expect.stringContaining("/es/home"),
  });
});

test("an unknown lang can't steer the redirect (no open redirect)", async () => {
  process.env.AUTH_DEMO = "true";
  await expect(
    login(undefined, form({ ...validLogin, lang: "//evil.example" })),
  ).rejects.toMatchObject({ digest: expect.stringContaining(";/es/home;") });
});

test("invalid input returns field errors and never echoes the password", async () => {
  process.env.AUTH_DEMO = "true";
  const state = await register(
    undefined,
    form({ lang: "es", name: "A", email: "x", phone: "", password: "short" }),
  );
  expect(state?.errors).toEqual({
    name: ["name"],
    email: ["email"],
    password: ["passwordMin"],
  });
  expect(JSON.stringify(state)).not.toContain("short");
});
