import { z } from "zod";

export const invoiceCustomerInfoSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  vehicleNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const invoiceItemInputSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative").optional(),
  gstRate: z.coerce.number().min(0, "GST rate cannot be negative").optional(),
});

export const createInvoiceSchema = z.object({
  placeOfSupply: z.string().optional(),
  placeOfSupplyCode: z.string().optional(),
  isInterState: z.boolean().optional(),
  customerInfo: invoiceCustomerInfoSchema.optional(),
  items: z.array(invoiceItemInputSchema).min(1, "At least one product item is required"),
  termsAndConditions: z.array(z.string()).optional(),
});

export const cancelInvoiceSchema = z.object({
  cancellationReason: z.string().min(3, "Cancellation reason is required (min 3 characters)").trim(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type CancelInvoiceInput = z.infer<typeof cancelInvoiceSchema>;
