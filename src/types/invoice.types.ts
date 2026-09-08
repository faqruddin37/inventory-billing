import { IBankDetails } from "./settings.types";

export interface IInvoiceCustomerInfo {
  name?: string;
  phone?: string;
  address?: string;
  vehicleNumber?: string;
  notes?: string;
}

export interface IInvoiceItemSnapshot {
  productId: string;
  name: string;
  sku: string;
  hsn: string;
  quantity: number;
  unit: string;
  unitPrice: number; // Base price excluding tax
  taxableAmount: number; // quantity * unitPrice
  gstRate: number; // 0, 5, 10, 12, 18, 28
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export type InvoiceStatus = "confirmed" | "cancelled";

export interface IInvoiceShopSnapshot {
  shopName: string;
  logoUrl?: string;
  address: string;
  city?: string;
  state: string;
  stateCode: string;
  pincode?: string;
  phone: string;
  email: string;
  gstin: string;
  invoiceFooter?: string;
  bankDetails?: IBankDetails;
}

export interface IInvoice {
  _id: string;
  invoiceNumber: string;
  invoiceDate: Date | string;
  placeOfSupply: string;
  placeOfSupplyCode?: string;
  isInterState: boolean;
  customerInfo?: IInvoiceCustomerInfo;
  shopSnapshot: IInvoiceShopSnapshot;
  items: IInvoiceItemSnapshot[];
  subtotal: number; // Sum of taxable amounts
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
  status: InvoiceStatus;
  cancellationReason?: string;
  cancelledAt?: Date | string;
  termsAndConditions?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface InvoiceFilterParams {
  search?: string;
  status?: "all" | "confirmed" | "cancelled";
  startDate?: string;
  endDate?: string;
  sortBy?: "invoiceDate" | "invoiceNumber" | "grandTotal";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface CreateInvoiceItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number; // Optional override; defaults to product selling price
  gstRate?: number; // Optional override; defaults to product GST rate
}

export interface CreateInvoicePayload {
  placeOfSupply?: string;
  placeOfSupplyCode?: string;
  isInterState?: boolean;
  customerInfo?: IInvoiceCustomerInfo;
  items: CreateInvoiceItemInput[];
  termsAndConditions?: string[];
}
