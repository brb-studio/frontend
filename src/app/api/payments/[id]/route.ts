import type { NextRequest } from "next/server";
import { getCheckout } from "@/features/payments/data";
import { errorResponse } from "@/shared/api/backend";

/** The payment screen polls this; the API checks the booking token or the customer's session. */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/payments/[id]">,
) {
  const { id } = await params;
  if (!/^[a-f\d]{24}$/.test(id)) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Not found" } },
      { status: 404 },
    );
  }
  const search = request.nextUrl.searchParams;
  try {
    return Response.json(
      await getCheckout(
        id,
        search.get("paymentToken") ?? undefined,
        search.get("secret") === "1",
      ),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
