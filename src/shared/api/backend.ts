import { cookies, headers } from "next/headers";
import * as z from "zod";

export const SESSION_COOKIE = "ms_session";

export const PLATFORM_COOKIE = "ms_platform";

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

  body?: unknown;

  platform?: boolean;
};

export function tenantHostOf(requestHeaders: Headers) {
  if (process.env.TENANT_HOST) return process.env.TENANT_HOST;
  const host =
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";
  const bare = /^(localhost|\d{1,3}(\.\d{1,3}){3}|\[[\da-f:]+\])(:\d+)?$/i.test(
    host,
  );
  return (bare && process.env.DEFAULT_TENANT_HOST) || host;
}

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
  const token = cookieStore.get(
    options.platform ? PLATFORM_COOKIE : SESSION_COOKIE,
  )?.value;
  const ip = visitorIp(requestHeaders.get("x-forwarded-for"));
  const secret = process.env.PROXY_SECRET;
  const host = tenantHostOf(requestHeaders);

  let response: Response;
  try {
    response = await fetch(new URL(path, base), {
      method: options.method ?? "GET",
      cache: "no-store",
      headers: {
        "X-Tenant-Host": host,
        ...(ip && secret
          ? { "X-Visitor-IP": ip, "X-Proxy-Secret": secret }
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

export async function sessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function tenantHost() {
  return tenantHostOf(await headers());
}

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
