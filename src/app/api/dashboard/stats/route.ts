import { NextRequest } from "next/server";
import { DashboardService } from "@/services/dashboard.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chartPeriod =
      (searchParams.get("chartPeriod") as "daily" | "weekly" | "monthly") || "daily";

    const dashboardData = await DashboardService.getDashboardData(chartPeriod);
    return successResponse(dashboardData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch dashboard stats";
    return errorResponse(message, 500);
  }
}
