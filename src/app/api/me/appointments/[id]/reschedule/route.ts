import * as z from "zod";
import { appointmentSchema } from "@/features/account/model";
import { backend, errorResponse } from "@/shared/api/backend";

const idParam = z.string().regex(/^[a-f\d]{24}$/);
const body = z.object({ startAt: z.iso.datetime({ offset: true }) });

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/me/appointments/[id]/reschedule">,
) {
  const { id } = await params;
  const parsed = body.safeParse(await request.json().catch(() => undefined));
  if (!idParam.safeParse(id).success || !parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION", message: "Invalid request" } },
      { status: 422 },
    );
  }
  try {
    return Response.json(
      await backend(`/v1/me/appointments/${id}/reschedule`, appointmentSchema, {
        method: "POST",
        body: parsed.data,
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
