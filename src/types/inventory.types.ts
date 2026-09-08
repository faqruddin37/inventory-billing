export type StockMovementType =
  | "STOCK_IN"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "SALE"
  | "SALE_REVERSAL";

export interface IStockTransaction {
  _id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  movementType: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  reference?: string;
  referenceInvoiceId?: string;
  referenceInvoiceNumber?: string;
  createdDate: Date;
}

export interface InventorySummary {
  totalProducts: number;
  activeProducts: number;
  archivedProducts: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalUnitsInStock: number;
}
