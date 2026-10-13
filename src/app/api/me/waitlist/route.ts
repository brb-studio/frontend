import { getMyWaitlist } from "@/features/waitlist/data";
import { errorResponse } from "@/shared/api/backend";

export async function GET() {
  try {
    return Response.json(await getMyWaitlist(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
