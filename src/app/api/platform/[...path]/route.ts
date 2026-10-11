import type { NextRequest } from "next/server";
import * as z from "zod";
import { backend, errorResponse } from "@/shared/api/backend";

/** Only the dashboard's read endpoints (optionally one cut by id), never auth or writes. */
const PLATFORM_PATH =
  /^(options|summary|breakdown|appointments(\/[a-f\d]{24})?)$/;

/** Read-only door for the global staff dashboard: GET on allow-listed paths, with the platform session cookie. */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/platform/[...path]">,
) {
  const path = (await params).path.join("/");
  if (!PLATFORM_PATH.test(path)) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Not found" } },
      { status: 404 },
    );
  }
  try {
    const data = await backend(
      `/platform/${path}${request.nextUrl.search}`,
      z.unknown(),
      { platform: true },
    );
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
