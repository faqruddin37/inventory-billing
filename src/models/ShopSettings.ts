import mongoose, { Schema, Model, Document } from "mongoose";
import { IShopSettings } from "@/types/settings.types";

export interface IShopSettingsDocument extends Document, Omit<IShopSettings, "_id"> {}

const BankDetailsSchema = new Schema(
  {
    accountName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    bankName: { type: String, trim: true },
    ifscCode: { type: String, trim: true, uppercase: true },
    upiId: { type: String, trim: true },
  },
  { _id: false }
);

const ShopSettingsSchema = new Schema<IShopSettingsDocument>(
  {
    shopName: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
      default: "Apex Auto Spares & Garage",
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Shop address is required"],
      trim: true,
      default: "Shop No. 4, Motor Market, Main Road",
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      default: "Mumbai",
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      default: "Maharashtra",
    },
    stateCode: {
      type: String,
      required: [true, "State Code is required"],
      trim: true,
      default: "27",
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
      default: "400001",
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      default: "+91 98765 43210",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "contact@apexautospares.com",
    },
    gstin: {
      type: String,
      required: [true, "GSTIN is required"],
      trim: true,
      uppercase: true,
      default: "27ABCDE1234F1Z5",
    },
    invoicePrefix: {
      type: String,
      required: [true, "Invoice prefix is required"],
      trim: true,
      uppercase: true,
      default: "INV-26-",
    },
    startingInvoiceNumber: {
      type: Number,
      required: [true, "Starting invoice number is required"],
      default: 1,
      min: 1,
    },
    termsAndConditions: {
      type: [String],
      default: [
        "Goods once sold will not be taken back or exchanged without valid reason.",
        "Warranty as per manufacturer terms & conditions.",
        "Subject to local jurisdiction.",
      ],
    },
    invoiceFooter: {
      type: String,
      trim: true,
      default: "Thank you for your business! Drive safely.",
    },
    bankDetails: {
      type: BankDetailsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

export const ShopSettings: Model<IShopSettingsDocument> =
  mongoose.models.ShopSettings ||
  mongoose.model<IShopSettingsDocument>("ShopSettings", ShopSettingsSchema);
