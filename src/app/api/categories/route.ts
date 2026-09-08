import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { CategoryService } from "@/services/category.service";
import { categorySchema } from "@/lib/validations/category.schema";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") as "all" | "active" | "archived") || "active";
    const categories = await CategoryService.listCategories(status);

    return successResponse(categories);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch categories";
    return errorResponse(message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = categorySchema.parse(body);

    const category = await CategoryService.createCategory(validatedData);

    return successResponse(category, "Category created successfully", 201);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return errorResponse(error.format() as unknown as Record<string, unknown>, 400, "Validation error");
    }
    const message = error instanceof Error ? error.message : "Failed to create category";
    return errorResponse(message, 400, message);
  }
}
