import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { InvoiceService } from "@/services/invoice.service";
import { cancelInvoiceSchema } from "@/lib/validations/invoice.schema";
import { successResponse, errorResponse } from "@/lib/utils/response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validatedData = cancelInvoiceSchema.parse(body);

    const cancelledInvoice = await InvoiceService.cancelInvoice(
      id,
      validatedData.cancellationReason
    );

    return successResponse(
      cancelledInvoice,
      `Invoice #${cancelledInvoice.invoiceNumber} has been cancelled and stock reversed successfully.`
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return errorResponse(error.format() as unknown as Record<string, unknown>, 400, "Validation error");
    }
    const message = error instanceof Error ? error.message : "Failed to cancel invoice";
    return errorResponse(message, 400, message);
  }
}
