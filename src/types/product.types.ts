export type GSTPercentage = 0 | 5 | 12 | 18 | 28;

export type ProductUnit = "pcs" | "ltr" | "set" | "box" | "kg" | "meter" | "pair" | "unit";

export type ProductStatus = "active" | "inactive" | "archived";

export interface IProduct {
  _id: string;
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

export interface ICategory {
  _id: string;
  name: string;
  description?: string;
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFilterParams {
  search?: string;
  category?: string;
  brand?: string;
  status?: "all" | "active" | "inactive" | "archived";
  stockStatus?: "all" | "in_stock" | "low_stock" | "out_of_stock";
  sortBy?: "name" | "sku" | "currentStock" | "sellingPrice" | "purchasePrice" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
