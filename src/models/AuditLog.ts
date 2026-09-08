import mongoose, { Schema, Model, Document } from "mongoose";
import { AuditAction } from "@/types/audit.types";

export interface IAuditLogDocument extends Document {
  action: AuditAction;
  details: string;
  entityId?: string;
  entityType?: "Product" | "Invoice" | "StockTransaction" | "ShopSettings" | "User";
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    details: {
      type: String,
      required: true,
      trim: true,
    },
    entityId: {
      type: String,
      sparse: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ["Product", "Invoice", "StockTransaction", "ShopSettings", "User"],
      sparse: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

export const AuditLog: Model<IAuditLogDocument> =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>("AuditLog", AuditLogSchema);
