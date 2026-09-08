import { z } from "zod";

export const shopSettingsSchema = z.object({
  shopName: z.string().min(2, "Shop name is required").trim(),
  logoUrl: z.string().optional().or(z.literal("")),
  address: z.string().min(3, "Address is required").trim(),
  city: z.string().min(2, "City is required").trim(),
  state: z.string().min(2, "State is required").trim(),
  stateCode: z.string().min(1, "State code is required").trim(),
  pincode: z.string().min(4, "Valid pincode is required").trim(),
  phone: z.string().min(8, "Phone number is required").trim(),
  email: z.string().email("Valid email address is required").trim().toLowerCase(),
  gstin: z.string().min(15, "GSTIN must be at least 15 characters").max(15).trim().toUpperCase(),
  invoicePrefix: z.string().min(1, "Invoice prefix is required").trim().toUpperCase(),
  startingInvoiceNumber: z.coerce.number().min(1, "Starting invoice number must be at least 1"),
  termsAndConditions: z.array(z.string()).default([]),
  invoiceFooter: z.string().optional().default("Thank you for your business! Drive safely."),
  bankDetails: z
    .object({
      accountName: z.string().optional().or(z.literal("")),
      accountNumber: z.string().optional().or(z.literal("")),
      bankName: z.string().optional().or(z.literal("")),
      ifscCode: z.string().optional().or(z.literal("")),
      upiId: z.string().optional().or(z.literal("")),
    })
    .optional(),
});

export type ShopSettingsInput = z.infer<typeof shopSettingsSchema>;
