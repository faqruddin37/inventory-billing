import { ReportsService } from "@/services/reports.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET() {
  try {
    const report = await ReportsService.getInventoryReport();
    return successResponse(report);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch inventory report";
    return errorResponse(message, 500);
  }
}
