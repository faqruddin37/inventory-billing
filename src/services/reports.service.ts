import { connectToDatabase } from "@/lib/db/connection";
import { Invoice } from "@/models/Invoice";
import { Product } from "@/models/Product";
import { StockTransaction } from "@/models/StockTransaction";
import { InventoryService } from "./inventory.service";
import mongoose from "mongoose";

export interface SalesReportData {
  periodLabel: string;
  totalSales: number;
  totalInvoices: number;
  averageBillValue: number;
  totalTaxable: number;
  totalGst: number;
  invoices: {
    _id: string;
    invoiceNumber: string;
    invoiceDate: Date;
    customerName: string;
    itemCount: number;
    subtotal: number;
    totalGst: number;
    grandTotal: number;
    status: string;
  }[];
}

export interface InventoryReportData {
  summary: {
    totalProducts: number;
    activeProducts: number;
    totalUnits: number;
    totalValuation: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  categoryValuation: {
    category: string;
    productCount: number;
    totalUnits: number;
    totalValuation: number;
  }[];
  movementTotals: {
    movementType: string;
    totalQuantity: number;
    count: number;
  }[];
  lowStockItems: {
    name: string;
    sku: string;
    category: string;
    currentStock: number;
    minStockLevel: number;
    unit: string;
    purchasePrice: number;
  }[];
}

export interface ProductReportData {
  topSelling: {
    productId: string;
    name: string;
    sku: string;
    category: string;
    unitsSold: number;
    totalRevenue: number;
    invoiceCount: number;
  }[];
  leastSellingOrDeadStock: {
    productId: string;
    name: string;
    sku: string;
    category: string;
    currentStock: number;
    purchasePrice: number;
    sellingPrice: number;
    unitsSold: number;
  }[];
}

export interface GSTReportData {
  summary: {
    totalTaxable: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalGst: number;
    totalGrand: number;
  };
  byRate: {
    gstRate: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalGst: number;
  }[];
  byState: {
    state: string;
    invoiceCount: number;
    taxableAmount: number;
    totalGst: number;
    grandTotal: number;
    isInterState: boolean;
  }[];
}

export class ReportsService {
  /**
   * Generates a Sales Report for a specific timeframe (Today, Yesterday, Week, Month, Custom)
   */
  static async getSalesReport(params: {
    preset?: "today" | "yesterday" | "week" | "month" | "custom";
    startDate?: string;
    endDate?: string;
  }): Promise<SalesReportData> {
    await connectToDatabase();

    const now = new Date();
    let start = new Date();
    let end = new Date();
    let periodLabel = "All Sales";

    const preset = params.preset || "month";

    if (preset === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      periodLabel = "Today's Sales";
    } else if (preset === "yesterday") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      periodLabel = "Yesterday's Sales";
    } else if (preset === "week") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      periodLabel = "Past 7 Days";
    } else if (preset === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      periodLabel = "This Month";
    } else if (preset === "custom" && params.startDate && params.endDate) {
      start = new Date(params.startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      periodLabel = `${params.startDate} to ${params.endDate}`;
    }

    const invoicesRaw = await Invoice.find({
      status: "confirmed",
      invoiceDate: { $gte: start, $lte: end },
    })
      .sort({ invoiceDate: -1 })
      .lean();

    let totalSales = 0;
    let totalTaxable = 0;
    let totalGst = 0;

    const invoices = invoicesRaw.map((inv) => {
      totalSales += inv.grandTotal;
      totalTaxable += inv.subtotal;
      totalGst += inv.totalGst;

      return {
        _id: inv._id.toString(),
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        customerName: inv.customerInfo?.name || "Counter Customer",
        itemCount: inv.items.length,
        subtotal: inv.subtotal,
        totalGst: inv.totalGst,
        grandTotal: inv.grandTotal,
        status: inv.status,
      };
    });

    const totalInvoices = invoices.length;
    const averageBillValue = totalInvoices > 0 ? Math.round(totalSales / totalInvoices) : 0;

    return {
      periodLabel,
      totalSales: Math.round(totalSales),
      totalInvoices,
      averageBillValue,
      totalTaxable: Math.round(totalTaxable),
      totalGst: Math.round(totalGst),
      invoices,
    };
  }

  /**
   * Generates comprehensive Inventory & Stock Valuation Report
   */
  static async getInventoryReport(): Promise<InventoryReportData> {
    await connectToDatabase();

    const summary = await InventoryService.getInventorySummary();

    // Category-wise Valuation
    const categoryValuationRaw = await Product.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$category",
          productCount: { $sum: 1 },
          totalUnits: { $sum: "$currentStock" },
          totalValuation: { $sum: { $multiply: ["$currentStock", "$purchasePrice"] } },
        },
      },
      { $sort: { totalValuation: -1 } },
    ]);

    const categoryValuation = categoryValuationRaw.map((c) => ({
      category: c._id || "Uncategorized",
      productCount: c.productCount,
      totalUnits: c.totalUnits,
      totalValuation: Math.round(c.totalValuation),
    }));

    // Stock Movement Totals (Ledger Aggregation)
    const movementTotalsRaw = await StockTransaction.aggregate([
      {
        $group: {
          _id: "$movementType",
          totalQuantity: { $sum: "$quantity" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const movementTotals = movementTotalsRaw.map((m) => ({
      movementType: m._id,
      totalQuantity: m.totalQuantity,
      count: m.count,
    }));

    // Low stock items list
    const lowStockRaw = await Product.find({
      status: "active",
      $expr: {
        $and: [
          { $gt: ["$currentStock", 0] },
          { $lte: ["$currentStock", "$minStockLevel"] },
        ],
      },
    })
      .sort({ currentStock: 1 })
      .lean();

    const lowStockItems = lowStockRaw.map((p) => ({
      name: p.name,
      sku: p.sku,
      category: p.category,
      currentStock: p.currentStock,
      minStockLevel: p.minStockLevel,
      unit: p.unit,
      purchasePrice: p.purchasePrice,
    }));

    return {
      summary: {
        totalProducts: summary.totalProducts,
        activeProducts: summary.activeProducts,
        totalUnits: summary.totalUnitsInStock,
        totalValuation: summary.totalInventoryValue,
        lowStockCount: summary.lowStockCount,
        outOfStockCount: summary.outOfStockCount,
      },
      categoryValuation,
      movementTotals,
      lowStockItems,
    };
  }

  /**
   * Generates Product Performance & Sales Analytics Report
   */
  static async getProductPerformanceReport(): Promise<ProductReportData> {
    await connectToDatabase();

    // Top Selling products aggregation from confirmed invoices
    const salesByProduct = await Invoice.aggregate([
      { $match: { status: "confirmed" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          sku: { $first: "$items.sku" },
          unitsSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalAmount" },
          invoiceCount: { $sum: 1 },
        },
      },
      { $sort: { unitsSold: -1, totalRevenue: -1 } },
    ]);

    const soldProductIds = new Set(salesByProduct.map((p) => p._id.toString()));

    // Find all active products in catalog to identify zero-sales / dead inventory
    const allProducts = await Product.find({ status: "active" }).lean();

    const topSelling = salesByProduct.map((p) => {
      const prod = allProducts.find((item) => item._id.toString() === p._id.toString());
      return {
        productId: p._id.toString(),
        name: p.name,
        sku: p.sku,
        category: prod?.category || "Spare Parts",
        unitsSold: p.unitsSold,
        totalRevenue: Math.round(p.totalRevenue),
        invoiceCount: p.invoiceCount,
      };
    });

    // Least selling / Dead inventory (products with 0 sales)
    const deadStockProducts = allProducts
      .filter((p) => !soldProductIds.has(p._id.toString()))
      .map((p) => ({
        productId: p._id.toString(),
        name: p.name,
        sku: p.sku,
        category: p.category,
        currentStock: p.currentStock,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        unitsSold: 0,
      }))
      .sort((a, b) => b.currentStock - a.currentStock);

    return {
      topSelling,
      leastSellingOrDeadStock: deadStockProducts,
    };
  }

  /**
   * Generates GST Tax Filing & Liability Summary Report
   */
  static async getGSTSummaryReport(params: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<GSTReportData> {
    await connectToDatabase();

    const matchQuery: Record<string, unknown> = { status: "confirmed" };

    if (params.startDate || params.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (params.startDate) {
        const start = new Date(params.startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.$gte = start;
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      matchQuery.invoiceDate = dateFilter;
    }

    // Rate-wise GST aggregation
    const rateWiseRaw = await Invoice.aggregate([
      { $match: matchQuery },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.gstRate",
          taxableAmount: { $sum: "$items.taxableAmount" },
          cgstAmount: { $sum: "$items.cgstAmount" },
          sgstAmount: { $sum: "$items.sgstAmount" },
          igstAmount: { $sum: "$items.igstAmount" },
          totalGst: { $sum: "$items.gstAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // State-wise breakdown
    const stateWiseRaw = await Invoice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$placeOfSupply",
          isInterState: { $first: "$isInterState" },
          invoiceCount: { $sum: 1 },
          taxableAmount: { $sum: "$subtotal" },
          totalGst: { $sum: "$totalGst" },
          grandTotal: { $sum: "$grandTotal" },
        },
      },
      { $sort: { grandTotal: -1 } },
    ]);

    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalGst = 0;
    let totalGrand = 0;

    const byRate = rateWiseRaw.map((r) => {
      totalTaxable += r.taxableAmount;
      totalCgst += r.cgstAmount;
      totalSgst += r.sgstAmount;
      totalIgst += r.igstAmount;
      totalGst += r.totalGst;

      return {
        gstRate: r._id,
        taxableAmount: Math.round(r.taxableAmount),
        cgstAmount: Math.round(r.cgstAmount),
        sgstAmount: Math.round(r.sgstAmount),
        igstAmount: Math.round(r.igstAmount),
        totalGst: Math.round(r.totalGst),
      };
    });

    const byState = stateWiseRaw.map((s) => {
      totalGrand += s.grandTotal;
      return {
        state: s._id || "Local",
        isInterState: s.isInterState,
        invoiceCount: s.invoiceCount,
        taxableAmount: Math.round(s.taxableAmount),
        totalGst: Math.round(s.totalGst),
        grandTotal: Math.round(s.grandTotal),
      };
    });

    return {
      summary: {
        totalTaxable: Math.round(totalTaxable),
        totalCgst: Math.round(totalCgst),
        totalSgst: Math.round(totalSgst),
        totalIgst: Math.round(totalIgst),
        totalGst: Math.round(totalGst),
        totalGrand: Math.round(totalGrand),
      },
      byRate,
      byState,
    };
  }
}
