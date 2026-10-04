import { sessionToken, tenantHost } from "@/shared/api/backend";

/**
 * Live notifications: this server opens the API's Server-Sent Events stream with the session from
 * the httpOnly cookie and pipes it to the browser. Closing the tab aborts the upstream request.
 */
export async function GET(request: Request) {
  const base = process.env.BACKEND_URL;
  const [token, host] = await Promise.all([sessionToken(), tenantHost()]);
  if (!token) return new Response(null, { status: 401 });
  if (!base) return new Response(null, { status: 503 });
  let upstream: Response;
  try {
    upstream = await fetch(new URL("/v1/notifications/stream", base), {
      headers: {
        "X-Forwarded-Host": host,
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
      cache: "no-store",
      signal: request.signal,
    });
  } catch {
    return new Response(null, { status: 503 });
  }
  if (!upstream.ok || !upstream.body)
    return new Response(null, { status: upstream.status });
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
