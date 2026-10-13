import { getMyOrders } from "@/features/products/data";
import { errorResponse } from "@/shared/api/backend";

export async function GET() {
  try {
    return Response.json(await getMyOrders(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
