import { InventoryService } from "@/services/inventory.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET() {
  try {
    const summary = await InventoryService.getInventorySummary();
    return successResponse(summary);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch inventory summary";
    return errorResponse(message, 500);
  }
}
