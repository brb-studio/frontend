import { cookies, headers } from "next/headers";
import * as z from "zod";

/** httpOnly cookie holding the API session token. The browser never reads it; only this server does. */
export const SESSION_COOKIE = "ms_session";

/** A failed API call: `code` is the API's stable error code (SLOT_TAKEN, EMAIL_TAKEN…). */
export type Issue = { path: string; message: string };

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly issues: Issue[] = [],
  ) {
    super(message);
  }
}

const errorBody = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    issues: z
      .array(z.object({ path: z.string(), message: z.string() }))
      .optional(),
  }),
});

type Options = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** JSON, or a Blob sent as-is with its own type (image uploads). */
  body?: unknown;
};

/**
 * The host that names the tenant. TENANT_HOST pins one tenant for every request. Otherwise it's the
 * visitor's host; a host with no tenant in it (localhost or a bare IP, e.g. a phone on the LAN) falls
 * back to DEFAULT_TENANT_HOST, so `http://localhost:3000` opens a shop instead of a 404.
 */
export function tenantHostOf(requestHeaders: Headers) {
  if (process.env.TENANT_HOST) return process.env.TENANT_HOST;
  const host =
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";
  const bare = /^(localhost|\d{1,3}(\.\d{1,3}){3}|\[[\da-f:]+\])(:\d+)?$/i.test(
    host,
  );
  return (bare && process.env.DEFAULT_TENANT_HOST) || host;
}

/**
 * The visitor's IP from X-Forwarded-For. Each reverse proxy in front of this server appends the address
 * it saw; everything left of those entries is whatever the client typed. TRUSTED_PROXY_HOPS (default 1)
 * is how many proxies we run in front of Next, so the entry that many places from the right is the one
 * our own edge wrote. Without a proxy (local dev) Next fills the header with the socket address.
 */
export function visitorIp(
  header: string | null,
  hops = Number(process.env.TRUSTED_PROXY_HOPS ?? 1),
) {
  const entries = (header ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const trusted = Number.isInteger(hops) && hops > 0 ? hops : 1;
  const ip = entries[Math.max(0, entries.length - trusted)];
  return ip && /^[\da-fA-F:.]{2,45}$/.test(ip) ? ip : undefined;
}

/**
 * Calls the MagicStudio API. Server only: it forwards the tenant's host (the visitor's host, or
 * TENANT_HOST for development and single-tenant installs), the visitor's IP for rate limits (vouched
 * for with PROXY_SECRET, which only this server and the API know) and the session token from its
 * httpOnly cookie. The response is validated against `schema`.
 */
export async function backend<S extends z.ZodType>(
  path: string,
  schema: S,
  options: Options = {},
): Promise<z.output<S>> {
  const base = process.env.BACKEND_URL;
  if (!base) throw new ApiError(503, "UNAVAILABLE", "BACKEND_URL is not set");
  const [requestHeaders, cookieStore] = await Promise.all([
    headers(),
    cookies(),
  ]);
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const ip = visitorIp(requestHeaders.get("x-forwarded-for"));
  const secret = process.env.PROXY_SECRET;
  const host = tenantHostOf(requestHeaders);

  let response: Response;
  try {
    response = await fetch(new URL(path, base), {
      method: options.method ?? "GET",
      cache: "no-store",
      headers: {
        "X-Forwarded-Host": host,
        ...(ip && secret
          ? { "X-Forwarded-For": ip, "X-Proxy-Secret": secret }
          : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.body === undefined
          ? {}
          : {
              "Content-Type":
                options.body instanceof Blob
                  ? options.body.type
                  : "application/json",
            }),
      },
      body:
        options.body === undefined || options.body instanceof Blob
          ? options.body
          : JSON.stringify(options.body),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ApiError(
      503,
      "UNAVAILABLE",
      "The booking service is unreachable",
    );
  }

  const data: unknown =
    response.status === 204
      ? undefined
      : await response.json().catch(() => undefined);
  if (!response.ok) {
    const parsed = errorBody.safeParse(data);
    throw parsed.success
      ? new ApiError(
          response.status,
          parsed.data.error.code,
          parsed.data.error.message,
          parsed.data.error.issues,
        )
      : new ApiError(response.status, "UNAVAILABLE", response.statusText);
  }
  return schema.parse(data);
}

/** The session token, for streaming calls that can't go through `backend()`. */
export async function sessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/** Same tenant host rule as `backend()`, for streaming calls. */
export async function tenantHost() {
  return tenantHostOf(await headers());
}

/** An API failure as a route-handler response: the API's code and status, never internals. */
export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
  }
  console.error(JSON.stringify({ level: "error", message: String(error) }));
  return Response.json(
    { error: { code: "INTERNAL", message: "Internal error" } },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}
