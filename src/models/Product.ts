import mongoose, { Schema, Model, Document } from "mongoose";
import { GSTPercentage, ProductStatus, ProductUnit } from "@/types/product.types";

export interface IProductDocument extends Document {
  name: string;
  sku: string;
  category: string;
  brand: string;
  hsn: string;
  purchasePrice: number;
  sellingPrice: number;
  gstRate: GSTPercentage;
  currentStock: number;
  minStockLevel: number;
  unit: ProductUnit | string;
  barcode?: string;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProductDocument>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
      index: true,
    },
    hsn: {
      type: String,
      required: [true, "HSN Code is required"],
      trim: true,
    },
    purchasePrice: {
      type: Number,
      required: [true, "Purchase price is required"],
      min: [0, "Purchase price cannot be negative"],
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Selling price cannot be negative"],
    },
    gstRate: {
      type: Number,
      enum: [0, 5, 12, 18, 28],
      default: 18,
      required: true,
    },
    currentStock: {
      type: Number,
      default: 0,
      min: [0, "Current stock cannot be negative"],
    },
    minStockLevel: {
      type: Number,
      default: 5,
      min: [0, "Minimum stock level cannot be negative"],
    },
    unit: {
      type: String,
      default: "pcs",
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for search
ProductSchema.index({ name: "text", sku: "text", brand: "text", category: "text" });

export const Product: Model<IProductDocument> =
  mongoose.models.Product || mongoose.model<IProductDocument>("Product", ProductSchema);
