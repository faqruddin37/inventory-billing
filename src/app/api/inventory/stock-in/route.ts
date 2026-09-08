import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { InventoryService } from "@/services/inventory.service";
import { stockInSchema } from "@/lib/validations/inventory.schema";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = stockInSchema.parse(body);

    const result = await InventoryService.addStock(
      validatedData.productId,
      validatedData.quantity,
      validatedData.reason,
      validatedData.reference
    );

    return successResponse(result, "Stock added successfully", 200);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return errorResponse(error.format() as unknown as Record<string, unknown>, 400, "Validation error");
    }
    const message = error instanceof Error ? error.message : "Failed to add stock";
    return errorResponse(message, 400, message);
  }
}
