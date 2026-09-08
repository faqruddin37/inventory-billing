import mongoose, { Schema, Model, Document, Types } from "mongoose";
import { StockMovementType } from "@/types/inventory.types";

export interface IStockTransactionDocument extends Document {
  productId: Types.ObjectId;
  movementType: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  reference?: string;
  referenceInvoiceId?: Types.ObjectId;
  referenceInvoiceNumber?: string;
  createdDate: Date;
}

const StockTransactionSchema = new Schema<IStockTransactionDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
      index: true,
    },
    movementType: {
      type: String,
      enum: ["STOCK_IN", "ADJUSTMENT_IN", "ADJUSTMENT_OUT", "SALE", "SALE_REVERSAL"],
      required: [true, "Movement type is required"],
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
    },
    previousQuantity: {
      type: Number,
      required: [true, "Previous stock quantity is required"],
    },
    newQuantity: {
      type: Number,
      required: [true, "New stock quantity is required"],
    },
    reason: {
      type: String,
      required: [true, "Reason for stock movement is required"],
      trim: true,
    },
    reference: {
      type: String,
      trim: true,
    },
    referenceInvoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      sparse: true,
      index: true,
    },
    referenceInvoiceNumber: {
      type: String,
      sparse: true,
      trim: true,
    },
    createdDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for item ledger chronological history lookups
StockTransactionSchema.index({ productId: 1, createdDate: -1 });

export const StockTransaction: Model<IStockTransactionDocument> =
  mongoose.models.StockTransaction ||
  mongoose.model<IStockTransactionDocument>("StockTransaction", StockTransactionSchema);
