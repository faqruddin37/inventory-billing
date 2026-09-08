import { connectToDatabase } from "@/lib/db/connection";
import { Invoice } from "@/models/Invoice";
import { Product } from "@/models/Product";
import { InventoryService } from "./inventory.service";
import mongoose from "mongoose";

export interface SalesChartPoint {
  date: string;
  sales: number;
  invoices: number;
  gst: number;
}

export interface TopProductMetric {
  productId: string;
  name: string;
  sku: string;
  category: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface DashboardData {
  metrics: {
    todaySales: number;
    thisMonthSales: number;
    totalInvoices: number;
    totalProducts: number;
    inventoryValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalGstCollected: number;
  };
  salesChart: SalesChartPoint[];
  topProducts: TopProductMetric[];
  recentInvoices: {
    _id: string;
    invoiceNumber: string;
    invoiceDate: Date;
    customerName: string;
    itemCount: number;
    grandTotal: number;
    status: string;
  }[];
  lowStockProducts: {
    _id: string;
    name: string;
    sku: string;
    currentStock: number;
    minStockLevel: number;
    unit: string;
    category: string;
  }[];
  gstSummary: {
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalGst: number;
  };
  insights: string[];
}

export class DashboardService {
  /**
   * Aggregates all live dashboard statistics using MongoDB aggregation pipelines
   */
  static async getDashboardData(
    chartPeriod: "daily" | "weekly" | "monthly" = "daily"
  ): Promise<DashboardData> {
    await connectToDatabase();

    const now = new Date();

    // Start of Today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Start of This Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    // Fetch Inventory Summary
    const inventorySummary = await InventoryService.getInventorySummary();

    // Aggregation 1: Today's Sales & Invoices
    const todaySalesAgg = await Invoice.aggregate([
      {
        $match: {
          status: "confirmed",
          invoiceDate: { $gte: startOfToday },
        },
      },
      {
        $group: {
          _id: null,
          sales: { $sum: "$grandTotal" },
          count: { $sum: 1 },
          gst: { $sum: "$totalGst" },
        },
      },
    ]);

    // Aggregation 2: This Month's Sales
    const monthSalesAgg = await Invoice.aggregate([
      {
        $match: {
          status: "confirmed",
          invoiceDate: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          sales: { $sum: "$grandTotal" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Aggregation 3: Total Lifetime GST & Invoices
    const lifetimeAgg = await Invoice.aggregate([
      {
        $match: {
          status: "confirmed",
        },
      },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalSales: { $sum: "$grandTotal" },
          totalCgst: { $sum: "$totalCgst" },
          totalSgst: { $sum: "$totalSgst" },
          totalIgst: { $sum: "$totalIgst" },
          totalGst: { $sum: "$totalGst" },
        },
      },
    ]);

    const lifetime = lifetimeAgg[0] || {
      totalInvoices: 0,
      totalSales: 0,
      totalCgst: 0,
      totalSgst: 0,
      totalIgst: 0,
      totalGst: 0,
    };

    // Aggregation 4: Sales Chart Data
    let chartStartDate = new Date();
    if (chartPeriod === "daily") {
      chartStartDate.setDate(now.getDate() - 14); // Past 14 days
      chartStartDate.setHours(0, 0, 0, 0);
    } else if (chartPeriod === "weekly") {
      chartStartDate.setDate(now.getDate() - 60); // Past 8-9 weeks
      chartStartDate.setHours(0, 0, 0, 0);
    } else {
      chartStartDate.setMonth(now.getMonth() - 11); // Past 12 months
      chartStartDate.setDate(1);
      chartStartDate.setHours(0, 0, 0, 0);
    }

    const chartDateFormat =
      chartPeriod === "daily"
        ? "%Y-%m-%d"
        : chartPeriod === "weekly"
        ? "%Y-W%V"
        : "%Y-%m";

    const salesChartRaw = await Invoice.aggregate([
      {
        $match: {
          status: "confirmed",
          invoiceDate: { $gte: chartStartDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: chartDateFormat, date: "$invoiceDate" },
          },
          sales: { $sum: "$grandTotal" },
          invoices: { $sum: 1 },
          gst: { $sum: "$totalGst" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const salesChart: SalesChartPoint[] = salesChartRaw.map((p) => ({
      date: p._id,
      sales: Math.round(p.sales),
      invoices: p.invoices,
      gst: Math.round(p.gst),
    }));

    // Aggregation 5: Top Selling Products
    const topProductsRaw = await Invoice.aggregate([
      { $match: { status: "confirmed" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          sku: { $first: "$items.sku" },
          quantitySold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalAmount" },
        },
      },
      { $sort: { quantitySold: -1, totalRevenue: -1 } },
      { $limit: 5 },
    ]);

    const topProducts: TopProductMetric[] = topProductsRaw.map((p) => ({
      productId: p._id.toString(),
      name: p.name,
      sku: p.sku,
      category: "",
      quantitySold: p.quantitySold,
      totalRevenue: Math.round(p.totalRevenue),
    }));

    // Aggregation 6: Recent Invoices (Last 5)
    const recentInvoicesRaw = await Invoice.find({})
      .sort({ invoiceDate: -1 })
      .limit(5)
      .lean();

    const recentInvoices = recentInvoicesRaw.map((inv) => ({
      _id: inv._id.toString(),
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      customerName: inv.customerInfo?.name || "Counter Customer",
      itemCount: inv.items.length,
      grandTotal: inv.grandTotal,
      status: inv.status,
    }));

    // Aggregation 7: Low Stock Products Alert List
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
      .limit(6)
      .lean();

    const lowStockProducts = lowStockRaw.map((p) => ({
      _id: p._id.toString(),
      name: p.name,
      sku: p.sku,
      currentStock: p.currentStock,
      minStockLevel: p.minStockLevel,
      unit: p.unit,
      category: p.category,
    }));

    // Generate Data-Driven Business Insights
    const insights: string[] = [];

    if (topProducts.length > 0) {
      insights.push(
        `Top performer "${topProducts[0].name}" leads sales with ${topProducts[0].quantitySold} units sold.`
      );
    }

    if (inventorySummary.lowStockCount > 0 || inventorySummary.outOfStockCount > 0) {
      insights.push(
        `Inventory alert: ${inventorySummary.outOfStockCount} items out of stock and ${inventorySummary.lowStockCount} items below threshold.`
      );
    }

    const monthSales = monthSalesAgg[0]?.sales || 0;
    if (monthSales > 0) {
      insights.push(
        `Month-to-date turnover stands at ₹${monthSales.toLocaleString("en-IN")} across ${
          monthSalesAgg[0]?.count || 0
        } invoices.`
      );
    }

    if (inventorySummary.totalInventoryValue > 0) {
      insights.push(
        `Active stock valuation is ₹${inventorySummary.totalInventoryValue.toLocaleString("en-IN")} across ${inventorySummary.totalUnitsInStock} total units.`
      );
    }

    if (insights.length === 0) {
      insights.push("Catalog and billing are ready. Generate sales bills to unlock automated performance insights.");
    }

    return {
      metrics: {
        todaySales: todaySalesAgg[0]?.sales || 0,
        thisMonthSales: monthSales,
        totalInvoices: lifetime.totalInvoices,
        totalProducts: inventorySummary.activeProducts,
        inventoryValue: inventorySummary.totalInventoryValue,
        lowStockCount: inventorySummary.lowStockCount,
        outOfStockCount: inventorySummary.outOfStockCount,
        totalGstCollected: lifetime.totalGst,
      },
      salesChart,
      topProducts,
      recentInvoices,
      lowStockProducts,
      gstSummary: {
        totalCgst: lifetime.totalCgst,
        totalSgst: lifetime.totalSgst,
        totalIgst: lifetime.totalIgst,
        totalGst: lifetime.totalGst,
      },
      insights,
    };
  }
}
