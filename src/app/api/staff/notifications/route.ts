import { getNotifications } from "@/features/staff/data";
import { errorResponse } from "@/shared/api/backend";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    return Response.json(
      await getNotifications(
        params.get("page") ?? "1",
        params.get("pageSize") ?? "5",
      ),
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
