import { NextRequest } from "next/server";
import { ReportsService } from "@/services/reports.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const preset =
      (searchParams.get("preset") as "today" | "yesterday" | "week" | "month" | "custom") ||
      "month";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const report = await ReportsService.getSalesReport({ preset, startDate, endDate });
    return successResponse(report);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch sales report";
    return errorResponse(message, 500);
  }
}
