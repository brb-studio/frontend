import { getNotifications } from "@/features/staff/data";
import { errorResponse } from "@/shared/api/backend";

export async function GET() {
  try {
    return Response.json(await getNotifications(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
