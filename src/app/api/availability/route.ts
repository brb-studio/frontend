import type { NextRequest } from "next/server";
import * as z from "zod";
import { getAvailability } from "@/features/booking/data";
import { errorResponse } from "@/shared/api/backend";

const slug = z
  .string()
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const query = z
  .object({ branch: slug, service: slug.optional(), package: slug.optional() })
  .refine((q) => !q.service !== !q.package);

/** Browser → this server → API: the API stays private and the tenant comes from this request's host. */
export async function GET(request: NextRequest) {
  const parsed = query.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION", message: "Invalid request" } },
      { status: 422 },
    );
  }
  const { branch, service, package: pkg } = parsed.data;
  try {
    const availability = await getAvailability({
      branch,
      kind: service ? "service" : "package",
      slug: service ?? pkg ?? "",
    });
    return Response.json(availability, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
