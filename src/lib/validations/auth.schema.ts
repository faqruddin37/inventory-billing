import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const setupOwnerSchema = z.object({
  name: z.string().min(2, "Owner name is required").trim(),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SetupOwnerInput = z.infer<typeof setupOwnerSchema>;
