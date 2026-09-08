export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "PRODUCT_CREATE"
  | "PRODUCT_UPDATE"
  | "PRODUCT_ARCHIVE"
  | "STOCK_IN"
  | "STOCK_ADJUST"
  | "INVOICE_CREATE"
  | "INVOICE_CANCEL"
  | "SETTINGS_UPDATE";

export interface IAuditLog {
  _id: string;
  action: AuditAction;
  details: string;
  entityId?: string;
  entityType?: "Product" | "Invoice" | "StockTransaction" | "ShopSettings" | "User";
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}
