import { z } from "zod";

export const stockInSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.coerce
    .number({ invalid_type_error: "Quantity must be a valid number" })
    .positive("Quantity to add must be greater than 0"),
  reason: z.string().min(2, "Reason is required (e.g. Purchase order, Supplier restock)").trim(),
  reference: z.string().optional(),
});

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  newQuantity: z.coerce
    .number({ invalid_type_error: "New quantity must be a valid number" })
    .min(0, "Stock quantity cannot be negative"),
  reason: z.string().min(3, "Detailed audit reason is required for stock adjustment").trim(),
  reference: z.string().optional(),
});

export type StockInInput = z.infer<typeof stockInSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
