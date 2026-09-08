import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { CategoryService } from "@/services/category.service";
import { categoryUpdateSchema } from "@/lib/validations/category.schema";
import { successResponse, errorResponse } from "@/lib/utils/response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validatedData = categoryUpdateSchema.parse(body);

    const category = await CategoryService.updateCategory(id, validatedData);

    return successResponse(category, "Category updated successfully");
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return errorResponse(error.format() as unknown as Record<string, unknown>, 400, "Validation error");
    }
    const message = error instanceof Error ? error.message : "Failed to update category";
    return errorResponse(message, 400, message);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const category = await CategoryService.archiveCategory(id);

    return successResponse(category, "Category archived successfully");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to archive category";
    return errorResponse(message, 400, message);
  }
}
