import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { ProductService } from "@/services/product.service";
import { productSchema } from "@/lib/validations/product.schema";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { ProductFilterParams } from "@/types/product.types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const params: ProductFilterParams = {
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      brand: searchParams.get("brand") || undefined,
      status: (searchParams.get("status") as ProductFilterParams["status"]) || "all",
      stockStatus: (searchParams.get("stockStatus") as ProductFilterParams["stockStatus"]) || "all",
      sortBy: (searchParams.get("sortBy") as ProductFilterParams["sortBy"]) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as ProductFilterParams["sortOrder"]) || "desc",
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20,
    };

    const result = await ProductService.listProducts(params);
    const [brands, categories] = await Promise.all([
      ProductService.getDistinctBrands(),
      ProductService.getDistinctCategories(),
    ]);

    return successResponse({
      ...result,
      availableBrands: brands,
      availableCategories: categories,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch products";
    return errorResponse(message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = productSchema.parse(body);

    const product = await ProductService.createProduct(validatedData);

    return successResponse(product, "Product created successfully", 201);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return errorResponse(error.format() as unknown as Record<string, unknown>, 400, "Validation error");
    }
    const message = error instanceof Error ? error.message : "Failed to create product";
    return errorResponse(message, 400, message);
  }
}
