import { NextRequest } from "next/server";
import { InvoiceService } from "@/services/invoice.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const invoice = await InvoiceService.getInvoiceById(id);

    if (!invoice) {
      return errorResponse("Invoice not found", 404);
    }

    return successResponse(invoice);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch invoice";
    return errorResponse(message, 500);
  }
}
