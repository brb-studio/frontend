import * as z from "zod";
import { backend, errorResponse } from "@/shared/api/backend";

const idParam = z.string().regex(/^[a-f\d]{24}$/);
const body = z.object({
  rfc: z.string(),
  legalName: z.string(),
  taxRegime: z.string(),
  postalCode: z.string(),
  cfdiUse: z.string(),
});
const invoiceSchema = z.unknown();

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/me/appointments/[id]/invoice">,
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
      await backend(`/v1/me/appointments/${id}/invoice`, invoiceSchema, {
        method: "POST",
        body: parsed.data,
      }),
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
