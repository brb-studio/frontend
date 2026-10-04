import type { NextRequest } from "next/server";
import * as z from "zod";
import { isAdminPath } from "@/features/admin/paths";
import { backend, errorResponse } from "@/shared/api/backend";

/** Read-only door for the admin panel's queries: GET on allow-listed staff paths, with the session cookie. */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/admin/[...path]">,
) {
  const path = (await params).path.join("/");
  if (!isAdminPath(path)) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Not found" } },
      { status: 404 },
    );
  }
  try {
    const data = await backend(
      `/v1/${path}${request.nextUrl.search}`,
      z.unknown(),
    );
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
