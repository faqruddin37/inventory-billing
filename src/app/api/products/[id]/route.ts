import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { ProductService } from "@/services/product.service";
import { productUpdateSchema } from "@/lib/validations/product.schema";
import { successResponse, errorResponse } from "@/lib/utils/response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const product = await ProductService.getProductById(id);

    if (!product) {
      return errorResponse("Product not found", 404);
    }

    return successResponse(product);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch product";
    return errorResponse(message, 500);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validatedData = productUpdateSchema.parse(body);

    const product = await ProductService.updateProduct(id, validatedData);

    return successResponse(product, "Product updated successfully");
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return errorResponse(error.format() as unknown as Record<string, unknown>, 400, "Validation error");
    }
    const message = error instanceof Error ? error.message : "Failed to update product";
    return errorResponse(message, 400, message);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    // Archive product (soft delete) to preserve historical data
    const product = await ProductService.archiveProduct(id);

    return successResponse(product, "Product archived successfully");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to archive product";
    return errorResponse(message, 400, message);
  }
}
