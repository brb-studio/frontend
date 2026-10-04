const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Shop photos, streamed from the API. Ids are random and a file never changes, so browsers keep it a year. */
export async function GET(
  _: Request,
  { params }: RouteContext<"/api/images/[id]">,
) {
  const { id } = await params;
  const base = process.env.BACKEND_URL;
  if (!base || !/^[\w-]{22}$/.test(id)) {
    return new Response(null, { status: 404 });
  }
  const response = await fetch(new URL(`/images/${id}`, base), {
    signal: AbortSignal.timeout(10_000),
  }).catch(() => undefined);
  const type = response?.headers.get("Content-Type") ?? "";
  if (!response?.ok || !response.body || !TYPES.has(type)) {
    return new Response(null, { status: response?.status === 404 ? 404 : 502 });
  }
  return new Response(response.body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
