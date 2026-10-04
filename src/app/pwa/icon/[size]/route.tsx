import { brandIcon } from "../../brand-icon";

const SIZES = new Set([192, 512]);

/** Stable icon URLs for the web app manifest: /pwa/icon/192 and /pwa/icon/512. */
export async function GET(
  _: Request,
  { params }: RouteContext<"/pwa/icon/[size]">,
) {
  const size = Number((await params).size);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  return brandIcon(size);
}
