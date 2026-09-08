import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required (min 2 characters)").trim(),
  sku: z.string().min(2, "SKU is required (min 2 characters)").trim().toUpperCase(),
  category: z.string().min(1, "Category is required").trim(),
  brand: z.string().min(1, "Brand is required").trim(),
  hsn: z.string().min(2, "HSN code is required").trim(),
  purchasePrice: z.coerce
    .number({ invalid_type_error: "Purchase price must be a valid number" })
    .min(0, "Purchase price cannot be negative"),
  sellingPrice: z.coerce
    .number({ invalid_type_error: "Selling price must be a valid number" })
    .min(0, "Selling price cannot be negative"),
  gstRate: z.coerce
    .number()
    .refine((val) => [0, 5, 12, 18, 28].includes(val), {
      message: "GST percentage must be 0, 5, 12, 18, or 28%",
    }),
  currentStock: z.coerce
    .number({ invalid_type_error: "Stock must be a valid number" })
    .min(0, "Current stock cannot be negative")
    .default(0),
  minStockLevel: z.coerce
    .number({ invalid_type_error: "Minimum stock must be a valid number" })
    .min(0, "Minimum stock cannot be negative")
    .default(5),
  unit: z.string().min(1, "Unit is required").default("pcs"),
  barcode: z.string().optional(),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
});

export const productUpdateSchema = productSchema.partial().omit({ currentStock: true });

export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
