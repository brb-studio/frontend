import * as z from "zod";
import { availabilitySchema } from "@/features/booking/model";
import { backend, errorResponse } from "@/shared/api/backend";

const idParam = z.string().regex(/^[a-f\d]{24}$/);

export async function GET(
  _: Request,
  { params }: RouteContext<"/api/me/appointments/[id]/slots">,
) {
  const { id } = await params;
  if (!idParam.safeParse(id).success) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Not found" } },
      { status: 404 },
    );
  }
  try {
    return Response.json(
      await backend(`/v1/me/appointments/${id}/slots`, availabilitySchema),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
