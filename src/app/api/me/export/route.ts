import { getMyExport } from "@/features/account/data";
import { errorResponse } from "@/shared/api/backend";

export async function GET() {
  try {
    return Response.json(await getMyExport(), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": 'attachment; filename="mis-datos.json"',
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
