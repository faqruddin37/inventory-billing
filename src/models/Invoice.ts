import mongoose, { Schema, Model, Document, Types } from "mongoose";
import {
  IInvoiceItemSnapshot,
  IInvoiceShopSnapshot,
  IInvoiceCustomerInfo,
  InvoiceStatus,
} from "@/types/invoice.types";

export interface IInvoiceDocument extends Document {
  invoiceNumber: string;
  invoiceDate: Date;
  placeOfSupply: string;
  placeOfSupplyCode?: string;
  isInterState: boolean;
  customerInfo?: IInvoiceCustomerInfo;
  shopSnapshot: IInvoiceShopSnapshot;
  items: IInvoiceItemSnapshot[];
  subtotal: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
  status: InvoiceStatus;
  cancellationReason?: string;
  cancelledAt?: Date;
  termsAndConditions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSnapshotSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    hsn: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: [0.01, "Quantity must be positive"] },
    unit: { type: String, default: "pcs" },
    unitPrice: { type: Number, required: true, min: [0, "Price cannot be negative"] },
    taxableAmount: { type: Number, required: true, min: [0, "Taxable amount cannot be negative"] },
    gstRate: { type: Number, required: true, min: [0, "GST rate cannot be negative"] },
    gstAmount: { type: Number, required: true, min: [0, "GST amount cannot be negative"] },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
  },
  { _id: false }
);

const InvoiceBankDetailsSchema = new Schema(
  {
    accountName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    bankName: { type: String, trim: true },
    ifscCode: { type: String, trim: true, uppercase: true },
    upiId: { type: String, trim: true },
  },
  { _id: false }
);

const InvoiceShopSnapshotSchema = new Schema(
  {
    shopName: { type: String, required: true },
    logoUrl: { type: String },
    address: { type: String, required: true },
    city: { type: String },
    state: { type: String, required: true },
    stateCode: { type: String, required: true },
    pincode: { type: String },
    phone: { type: String, required: true },
    email: { type: String },
    gstin: { type: String, required: true },
    invoiceFooter: { type: String },
    bankDetails: { type: InvoiceBankDetailsSchema, default: () => ({}) },
  },
  { _id: false }
);

const InvoiceCustomerInfoSchema = new Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    vehicleNumber: { type: String, trim: true, uppercase: true },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoiceDocument>(
  {
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      unique: true,
      trim: true,
      index: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    placeOfSupply: {
      type: String,
      required: [true, "Place of supply is required"],
      trim: true,
    },
    placeOfSupplyCode: {
      type: String,
      trim: true,
    },
    isInterState: {
      type: Boolean,
      default: false,
    },
    customerInfo: {
      type: InvoiceCustomerInfoSchema,
      default: () => ({}),
    },
    shopSnapshot: {
      type: InvoiceShopSnapshotSchema,
      required: true,
    },
    items: {
      type: [InvoiceItemSnapshotSchema],
      required: true,
      validate: [
        (val: IInvoiceItemSnapshot[]) => val.length > 0,
        "Invoice must have at least one line item",
      ],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCgst: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSgst: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalIgst: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalGst: {
      type: Number,
      required: true,
      min: 0,
    },
    roundOff: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    amountInWords: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
      index: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
    termsAndConditions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast reporting and date search
InvoiceSchema.index({ invoiceDate: -1, status: 1 });
InvoiceSchema.index({ "shopSnapshot.gstin": 1, invoiceDate: -1 });

export const Invoice: Model<IInvoiceDocument> =
  mongoose.models.Invoice || mongoose.model<IInvoiceDocument>("Invoice", InvoiceSchema);
