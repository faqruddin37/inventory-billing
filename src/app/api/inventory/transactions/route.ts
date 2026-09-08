import { NextRequest } from "next/server";
import { InventoryService } from "@/services/inventory.service";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { StockMovementType } from "@/types/inventory.types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const productId = searchParams.get("productId") || undefined;
    const movementType = (searchParams.get("movementType") as StockMovementType | "all") || "all";
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;

    const result = await InventoryService.getStockHistory({
      productId,
      movementType,
      page,
      limit,
    });

    return successResponse(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch stock transactions";
    return errorResponse(message, 500);
  }
}
