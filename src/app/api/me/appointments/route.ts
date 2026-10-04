import { getMyAppointments } from "@/features/account/data";
import { errorResponse } from "@/shared/api/backend";

export async function GET() {
  try {
    return Response.json(await getMyAppointments(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
