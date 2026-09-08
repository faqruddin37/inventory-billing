import { NextRequest } from "next/server";
import { ProductService } from "@/services/product.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (status !== "active" && status !== "archived") {
      return errorResponse("Status must be either 'active' or 'archived'", 400);
    }

    const product =
      status === "active"
        ? await ProductService.activateProduct(id)
        : await ProductService.archiveProduct(id);

    return successResponse(product, `Product ${status === "active" ? "activated" : "archived"} successfully`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update status";
    return errorResponse(message, 400, message);
  }
}
