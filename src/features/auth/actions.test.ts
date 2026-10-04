import { afterEach, beforeEach, expect, mock, spyOn, test } from "bun:test";

// Server actions read the request's cookies and headers; stand in for Next's request scope.
const jar = new Map<string, { value: string; options?: unknown }>();
mock.module("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const entry = jar.get(name);
      return entry && { name, value: entry.value };
    },
    set: (name: string, value: string, options?: unknown) =>
      jar.set(name, { value, options }),
    delete: (name: string) => jar.delete(name),
  }),
  headers: async () => new Headers({ host: "magicstudio.localhost:3000" }),
}));
const { changePassword, login, register } = await import("./actions");

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

/** The API answering every call with `status` and `body`. */
const api = (status: number, body: unknown) =>
  spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(async () => Response.json(body, { status }), {
      preconnect: fetch.preconnect,
    }),
  );

let restore: (() => void) | undefined;
beforeEach(() => {
  process.env.BACKEND_URL = "http://api.test";
  jar.clear();
});
afterEach(() => {
  restore?.();
  restore = undefined;
});

test("a valid login stores the session in an httpOnly cookie and enters the app", async () => {
  const spy = api(200, {
    token: "t".repeat(43),
    expiresAt: "2026-11-01T00:00:00.000Z",
    user: { role: "customer" },
  });
  restore = () => spy.mockRestore();
  await expect(login(undefined, form(validLogin))).rejects.toMatchObject({
    digest: expect.stringContaining("/es/home"),
  });
  const [url, init] = spy.mock.calls[0] ?? [];
  expect(String(url)).toBe("http://api.test/v1/auth/login");
  expect(new Headers(init?.headers).get("x-forwarded-host")).toBe(
    "magicstudio.localhost:3000",
  );
  expect(jar.get("ms_session")).toMatchObject({
    value: "t".repeat(43),
    options: { httpOnly: true, sameSite: "lax", path: "/" },
  });
});

test("wrong credentials, a taken email and an unreachable API come back as form errors", async () => {
  let spy = api(401, {
    error: {
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password",
    },
  });
  expect(await login(undefined, form(validLogin))).toEqual({
    formError: "invalidCredentials",
    values: { email: "ana@example.com" },
  });
  spy.mockRestore();

  spy = api(409, {
    error: { code: "EMAIL_TAKEN", message: "Email already registered" },
  });
  const taken = await register(
    undefined,
    form({
      lang: "es",
      name: "Ana López",
      email: "ana@example.com",
      phone: "",
      password: "supersecret",
    }),
  );
  expect(taken?.errors).toEqual({ email: ["emailTaken"] });
  spy.mockRestore();

  spy = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(async () => Promise.reject(new Error("ECONNREFUSED")), {
      preconnect: fetch.preconnect,
    }),
  );
  restore = () => spy.mockRestore();
  expect(await login(undefined, form(validLogin))).toMatchObject({
    formError: "unavailable",
  });
  expect(jar.size).toBe(0);
});

test("a team member signs in straight to the admin panel", async () => {
  const spy = api(200, {
    token: "t".repeat(43),
    expiresAt: "2026-11-01T00:00:00.000Z",
    user: { role: "barber" },
  });
  restore = () => spy.mockRestore();
  await expect(login(undefined, form(validLogin))).rejects.toMatchObject({
    digest: expect.stringContaining(";/es/admin;"),
  });
});

test("an unknown lang can't steer the redirect (no open redirect)", async () => {
  const spy = api(200, {
    token: "t".repeat(43),
    expiresAt: "2026-11-01T00:00:00.000Z",
    user: { role: "customer" },
  });
  restore = () => spy.mockRestore();
  await expect(
    login(undefined, form({ ...validLogin, lang: "//evil.example" })),
  ).rejects.toMatchObject({
    digest: expect.stringContaining(";/es/home;"),
  });
});

test("invalid input returns field errors, never calls the API and never echoes the password", async () => {
  const spy = api(500, {});
  restore = () => spy.mockRestore();
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
  expect(spy).not.toHaveBeenCalled();
});

test("changing the password keeps this session and maps a wrong current password to its field", async () => {
  jar.set("ms_session", { value: "t".repeat(43) });
  const passwords = form({
    currentPassword: "old-secret",
    newPassword: "new-secret-123",
  });

  let spy = api(403, {
    error: { code: "WRONG_PASSWORD", message: "Current password is wrong" },
  });
  expect(await changePassword(undefined, passwords)).toEqual({
    errors: { currentPassword: ["wrongPassword"] },
  });
  spy.mockRestore();

  spy = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(async () => new Response(null, { status: 204 }), {
      preconnect: fetch.preconnect,
    }),
  );
  restore = () => spy.mockRestore();
  expect(await changePassword(undefined, passwords)).toEqual({ done: true });
  const [url, init] = spy.mock.calls[0] ?? [];
  expect(String(url)).toBe("http://api.test/v1/auth/password");
  expect(new Headers(init?.headers).get("authorization")).toBe(
    `Bearer ${"t".repeat(43)}`,
  );
  expect(JSON.parse(String(init?.body))).toEqual({
    currentPassword: "old-secret",
    newPassword: "new-secret-123",
  });
  expect(jar.get("ms_session")?.value).toBe("t".repeat(43));
});
