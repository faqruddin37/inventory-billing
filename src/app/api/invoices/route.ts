import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { InvoiceService } from "@/services/invoice.service";
import { createInvoiceSchema } from "@/lib/validations/invoice.schema";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { InvoiceFilterParams } from "@/types/invoice.types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const params: InvoiceFilterParams = {
      search: searchParams.get("search") || undefined,
      status: (searchParams.get("status") as InvoiceFilterParams["status"]) || "all",
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      sortBy: (searchParams.get("sortBy") as InvoiceFilterParams["sortBy"]) || "invoiceDate",
      sortOrder: (searchParams.get("sortOrder") as InvoiceFilterParams["sortOrder"]) || "desc",
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20,
    };

    const result = await InvoiceService.listInvoices(params);
    return successResponse(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch invoices";
    return errorResponse(message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = createInvoiceSchema.parse(body);

    const invoice = await InvoiceService.createInvoice(validatedData);

    return successResponse(invoice, "Invoice created successfully", 201);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return errorResponse(error.format() as unknown as Record<string, unknown>, 400, "Validation error");
    }
    const message = error instanceof Error ? error.message : "Failed to create invoice";
    return errorResponse(message, 400, message);
  }
}
