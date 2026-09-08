"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  SalesReportData,
  InventoryReportData,
  ProductReportData,
  GSTReportData,
} from "@/services/reports.service";
import { formatINR, formatDate, formatDateTime } from "@/lib/utils/formatters";
import { exportToCSV } from "@/lib/utils/csvExport";
import {
  BarChart3,
  TrendingUp,
  Receipt,
  Boxes,
  Download,
  Calendar,
  AlertTriangle,
  Package,
  Sparkles,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Percent,
} from "lucide-react";

type ReportTab = "sales" | "inventory" | "products" | "gst";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("sales");

  // Sales Report state
  const [salesPreset, setSalesPreset] = useState<"today" | "yesterday" | "week" | "month" | "custom">("month");
  const [salesStartDate, setSalesStartDate] = useState<string>("");
  const [salesEndDate, setSalesEndDate] = useState<string>("");
  const [salesData, setSalesData] = useState<SalesReportData | null>(null);
  const [loadingSales, setLoadingSales] = useState(false);

  // Inventory Report state
  const [inventoryData, setInventoryData] = useState<InventoryReportData | null>(null);
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Product Report state
  const [productData, setProductData] = useState<ProductReportData | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // GST Report state
  const [gstStartDate, setGstStartDate] = useState<string>("");
  const [gstEndDate, setGstEndDate] = useState<string>("");
  const [gstData, setGstData] = useState<GSTReportData | null>(null);
  const [loadingGst, setLoadingGst] = useState(false);

  // Fetch Sales Report
  const fetchSalesReport = useCallback(async () => {
    setLoadingSales(true);
    try {
      let url = `/api/reports/sales?preset=${salesPreset}`;
      if (salesPreset === "custom" && salesStartDate && salesEndDate) {
        url += `&startDate=${salesStartDate}&endDate=${salesEndDate}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setSalesData(json.data);
      }
    } catch (e) {
      console.error("Failed to load sales report:", e);
    } finally {
      setLoadingSales(false);
    }
  }, [salesPreset, salesStartDate, salesEndDate]);

  // Fetch Inventory Report
  const fetchInventoryReport = useCallback(async () => {
    setLoadingInventory(true);
    try {
      const res = await fetch("/api/reports/inventory");
      const json = await res.json();
      if (json.success && json.data) {
        setInventoryData(json.data);
      }
    } catch (e) {
      console.error("Failed to load inventory report:", e);
    } finally {
      setLoadingInventory(false);
    }
  }, []);

  // Fetch Product Performance Report
  const fetchProductReport = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/reports/products");
      const json = await res.json();
      if (json.success && json.data) {
        setProductData(json.data);
      }
    } catch (e) {
      console.error("Failed to load product report:", e);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Fetch GST Report
  const fetchGstReport = useCallback(async () => {
    setLoadingGst(true);
    try {
      let url = "/api/reports/gst";
      if (gstStartDate && gstEndDate) {
        url += `?startDate=${gstStartDate}&endDate=${gstEndDate}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setGstData(json.data);
      }
    } catch (e) {
      console.error("Failed to load GST report:", e);
    } finally {
      setLoadingGst(false);
    }
  }, [gstStartDate, gstEndDate]);

  // Load active tab data
  useEffect(() => {
    if (activeTab === "sales") {
      fetchSalesReport();
    } else if (activeTab === "inventory") {
      fetchInventoryReport();
    } else if (activeTab === "products") {
      fetchProductReport();
    } else if (activeTab === "gst") {
      fetchGstReport();
    }
  }, [activeTab, fetchSalesReport, fetchInventoryReport, fetchProductReport, fetchGstReport]);

  // Handlers for CSV Exports
  const exportSalesCSV = () => {
    if (!salesData || !salesData.invoices.length) return;
    const headers = [
      "Invoice Number",
      "Invoice Date",
      "Customer Name",
      "Items Count",
      "Taxable Subtotal (INR)",
      "Total GST (INR)",
      "Grand Total (INR)",
      "Status",
    ];
    const rows = salesData.invoices.map((inv) => [
      inv.invoiceNumber,
      formatDateTime(inv.invoiceDate),
      inv.customerName,
      inv.itemCount,
      inv.subtotal,
      inv.totalGst,
      inv.grandTotal,
      inv.status,
    ]);
    exportToCSV(`Sales_Report_${salesPreset}`, headers, rows);
  };

  const exportInventoryCSV = () => {
    if (!inventoryData) return;
    const headers = ["Category", "Product Count", "Total Units in Stock", "Total Valuation (INR)"];
    const rows = inventoryData.categoryValuation.map((c) => [
      c.category,
      c.productCount,
      c.totalUnits,
      c.totalValuation,
    ]);
    exportToCSV("Inventory_Valuation_Report", headers, rows);
  };

  const exportLowStockCSV = () => {
    if (!inventoryData || !inventoryData.lowStockItems.length) return;
    const headers = [
      "Part Name",
      "SKU",
      "Category",
      "Current Stock",
      "Min Stock Level",
      "Unit",
      "Unit Cost (INR)",
    ];
    const rows = inventoryData.lowStockItems.map((p) => [
      p.name,
      p.sku,
      p.category,
      p.currentStock,
      p.minStockLevel,
      p.unit,
      p.purchasePrice,
    ]);
    exportToCSV("Low_Stock_Action_List", headers, rows);
  };

  const exportTopProductsCSV = () => {
    if (!productData || !productData.topSelling.length) return;
    const headers = ["Part Name", "SKU", "Category", "Units Sold", "Total Revenue (INR)", "Invoice Count"];
    const rows = productData.topSelling.map((p) => [
      p.name,
      p.sku,
      p.category,
      p.unitsSold,
      p.totalRevenue,
      p.invoiceCount,
    ]);
    exportToCSV("Top_Selling_Parts_Report", headers, rows);
  };

  const exportDeadStockCSV = () => {
    if (!productData || !productData.leastSellingOrDeadStock.length) return;
    const headers = [
      "Part Name",
      "SKU",
      "Category",
      "Current Stock",
      "Purchase Cost (INR)",
      "Selling Price (INR)",
      "Units Sold",
    ];
    const rows = productData.leastSellingOrDeadStock.map((p) => [
      p.name,
      p.sku,
      p.category,
      p.currentStock,
      p.purchasePrice,
      p.sellingPrice,
      p.unitsSold,
    ]);
    exportToCSV("Dead_Stock_Zero_Sales_Report", headers, rows);
  };

  const exportGstCSV = () => {
    if (!gstData || !gstData.byRate.length) return;
    const headers = [
      "GST Rate (%)",
      "Taxable Base Amount (INR)",
      "CGST (INR)",
      "SGST (INR)",
      "IGST (INR)",
      "Total GST Liability (INR)",
    ];
    const rows = gstData.byRate.map((r) => [
      `${r.gstRate}%`,
      r.taxableAmount,
      r.cgstAmount,
      r.sgstAmount,
      r.igstAmount,
      r.totalGst,
    ]);
    exportToCSV("GST_Tax_Filing_Summary", headers, rows);
  };

  return (
    <PageContainer
      title="Business Reports & Tax Filings"
      description="Aggregated real-time metrics for sales turnover, inventory valuation, product performance rankings, and GST tax liability summaries."
    >
      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("sales")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-heading font-medium transition-all ${
            activeTab === "sales"
              ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20"
              : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-sm"
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Sales Report
        </button>

        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-heading font-medium transition-all ${
            activeTab === "inventory"
              ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20"
              : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-sm"
          }`}
        >
          <Boxes className="w-4 h-4" /> Inventory & Valuation
        </button>

        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-heading font-medium transition-all ${
            activeTab === "products"
              ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20"
              : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-sm"
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Product Performance
        </button>

        <button
          onClick={() => setActiveTab("gst")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-heading font-medium transition-all ${
            activeTab === "gst"
              ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20"
              : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-sm"
          }`}
        >
          <Receipt className="w-4 h-4" /> GST Tax Filings
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SALES REPORT                                                       */}
      {/* ========================================================================= */}
      {activeTab === "sales" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <Card className="p-4 bg-white border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(["today", "yesterday", "week", "month", "custom"] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setSalesPreset(preset)}
                    className={`px-3 py-1.5 rounded-md text-xs font-heading font-medium capitalize transition-colors ${
                      salesPreset === preset
                        ? "bg-blue-600 text-white font-bold shadow-sm"
                        : "bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {preset === "week"
                      ? "Past 7 Days"
                      : preset === "month"
                      ? "This Month"
                      : preset}
                  </button>
                ))}
              </div>

              {/* Custom Date Pickers & Actions */}
              <div className="flex flex-wrap items-center gap-3">
                {salesPreset === "custom" && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={salesStartDate}
                      onChange={(e) => setSalesStartDate(e.target.value)}
                      className="h-8 text-xs w-36 bg-white border-slate-200"
                    />
                    <span className="text-slate-500 text-xs">to</span>
                    <Input
                      type="date"
                      value={salesEndDate}
                      onChange={(e) => setSalesEndDate(e.target.value)}
                      className="h-8 text-xs w-36 bg-white border-slate-200"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={fetchSalesReport}
                      disabled={!salesStartDate || !salesEndDate}
                      className="h-8 text-xs"
                    >
                      Apply
                    </Button>
                  </div>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportSalesCSV}
                  disabled={!salesData || salesData.invoices.length === 0}
                  className="text-xs ml-auto"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Export CSV
                </Button>
              </div>
            </div>
          </Card>

          {/* Sales Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4 bg-white border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-heading uppercase tracking-wider">
                Total Turnover
              </p>
              <h3 className="text-2xl font-bold font-heading text-blue-600 mt-1">
                {loadingSales ? "..." : formatINR(salesData?.totalSales || 0)}
              </h3>
              <span className="text-[11px] text-slate-500 font-sans mt-1 block">
                {salesData?.periodLabel}
              </span>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-heading uppercase tracking-wider">
                Taxable Subtotal
              </p>
              <h3 className="text-2xl font-bold font-heading text-slate-900 mt-1">
                {loadingSales ? "..." : formatINR(salesData?.totalTaxable || 0)}
              </h3>
              <span className="text-[11px] text-slate-500 font-sans mt-1 block">
                Base without tax
              </span>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-heading uppercase tracking-wider">
                Total GST Collected
              </p>
              <h3 className="text-2xl font-bold font-heading text-emerald-600 mt-1">
                {loadingSales ? "..." : formatINR(salesData?.totalGst || 0)}
              </h3>
              <span className="text-[11px] text-slate-500 font-sans mt-1 block">
                CGST + SGST + IGST
              </span>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-heading uppercase tracking-wider">
                Invoices Generated
              </p>
              <h3 className="text-2xl font-bold font-heading text-slate-900 mt-1">
                {loadingSales ? "..." : salesData?.totalInvoices || 0}
              </h3>
              <span className="text-[11px] text-slate-500 font-sans mt-1 block">
                Confirmed bills
              </span>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-heading uppercase tracking-wider">
                Average Bill Value
              </p>
              <h3 className="text-2xl font-bold font-heading text-slate-900 mt-1">
                {loadingSales ? "..." : formatINR(salesData?.averageBillValue || 0)}
              </h3>
              <span className="text-[11px] text-slate-500 font-sans mt-1 block">
                Per customer transaction
              </span>
            </Card>
          </div>

          {/* Invoices Breakdown Table */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <Receipt className="w-4 h-4 text-blue-600" /> Invoices List ({salesData?.periodLabel})
                </CardTitle>
                <CardDescription>
                  Detailed ledger of confirmed customer transactions for the selected period
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSales ? (
                <div className="py-12 text-center text-slate-400">Loading sales records...</div>
              ) : !salesData || salesData.invoices.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No Invoices Found"
                  description="No sales invoices were recorded for this timeframe."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-center">Items</TableHead>
                        <TableHead className="text-right">Taxable Amount</TableHead>
                        <TableHead className="text-right">GST Total</TableHead>
                        <TableHead className="text-right">Grand Total</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesData.invoices.map((inv) => (
                        <TableRow key={inv._id} className="hover:bg-blue-50/40">
                          <TableCell className="font-mono font-bold text-blue-600">
                            {inv.invoiceNumber}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {formatDateTime(inv.invoiceDate)}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-900">
                            {inv.customerName}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs text-slate-700">
                            {inv.itemCount}
                          </TableCell>
                          <TableCell className="text-right font-mono text-slate-700">
                            {formatINR(inv.subtotal)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-emerald-600 font-medium">
                            {formatINR(inv.totalGst)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-slate-900">
                            {formatINR(inv.grandTotal)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={inv.status === "confirmed" ? "success" : "danger"}>
                              {inv.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INVENTORY & VALUATION REPORT                                       */}
      {/* ========================================================================= */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-white border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-heading uppercase tracking-wider">
                Total Inventory Valuation
              </p>
              <h3 className="text-2xl font-bold font-heading text-emerald-600 mt-1">
                {loadingInventory
                  ? "..."
                  : formatINR(inventoryData?.summary.totalValuation || 0)}
              </h3>
              <span className="text-[11px] text-slate-500 font-sans mt-1 block">
                Purchase cost valuation of active parts
              </span>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-heading uppercase tracking-wider">
                Total Stock Units
              </p>
              <h3 className="text-2xl font-bold font-heading text-slate-900 mt-1">
                {loadingInventory ? "..." : inventoryData?.summary.totalUnits || 0}
              </h3>
              <span className="text-[11px] text-slate-500 font-sans mt-1 block">
                Across {inventoryData?.summary.activeProducts || 0} active SKU items
              </span>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-sm">
              <p className="text-xs text-amber-600 font-heading uppercase tracking-wider">
                Low Stock Threshold Alerts
              </p>
              <h3 className="text-2xl font-bold font-heading text-amber-600 mt-1">
                {loadingInventory ? "..." : inventoryData?.summary.lowStockCount || 0}
              </h3>
              <span className="text-[11px] text-slate-500 font-sans mt-1 block">
                Parts needing re-order
              </span>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-sm">
              <p className="text-xs text-rose-600 font-heading uppercase tracking-wider">
                Out of Stock Items
              </p>
              <h3 className="text-2xl font-bold font-heading text-rose-600 mt-1">
                {loadingInventory ? "..." : inventoryData?.summary.outOfStockCount || 0}
              </h3>
              <span className="text-[11px] text-slate-500 font-sans mt-1 block">
                Depleted inventory
              </span>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Category Valuation Table (7 Cols) */}
            <Card className="lg:col-span-7 bg-white border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                    <Boxes className="w-4 h-4 text-blue-600" /> Category-Wise Valuation Breakdown
                  </CardTitle>
                  <CardDescription>Capital allocation across inventory departments</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={exportInventoryCSV} className="text-xs">
                  <Download className="w-3 h-3 mr-1 text-blue-600" /> Export
                </Button>
              </CardHeader>
              <CardContent>
                {loadingInventory ? (
                  <div className="py-8 text-center text-slate-400">Calculating valuations...</div>
                ) : !inventoryData?.categoryValuation.length ? (
                  <EmptyState icon={Boxes} title="No Category Data" description="No active parts registered." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-center">Products</TableHead>
                        <TableHead className="text-center">Total Units</TableHead>
                        <TableHead className="text-right">Valuation (INR)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryData.categoryValuation.map((cat) => (
                        <TableRow key={cat.category} className="hover:bg-blue-50/40">
                          <TableCell className="font-semibold text-slate-900">{cat.category}</TableCell>
                          <TableCell className="text-center font-mono text-xs text-slate-700">{cat.productCount}</TableCell>
                          <TableCell className="text-center font-mono text-xs text-slate-700">{cat.totalUnits}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-emerald-600">
                            {formatINR(cat.totalValuation)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Stock Movement Ledger Totals (5 Cols) */}
            <Card className="lg:col-span-5 bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <Clock className="w-4 h-4 text-blue-600" /> Stock Movement Totals
                </CardTitle>
                <CardDescription>Historical ledger aggregation by movement type</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingInventory ? (
                  <div className="py-8 text-center text-slate-400">Loading ledger totals...</div>
                ) : !inventoryData?.movementTotals.length ? (
                  <EmptyState icon={Clock} title="No Movements" description="No stock ledger entries yet." />
                ) : (
                  <div className="space-y-3 font-sans text-xs">
                    {inventoryData.movementTotals.map((m) => (
                      <div
                        key={m.movementType}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-900 uppercase tracking-wider block font-heading text-xs">
                            {m.movementType.replace("_", " ")}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {m.count} total ledger transactions
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-blue-600 text-sm block">
                            {m.totalQuantity} units
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Action List */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Low Stock Restock Action List
                </CardTitle>
                <CardDescription>
                  Items currently at or below safety stock levels requiring immediate replenishment
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={exportLowStockCSV}
                disabled={!inventoryData?.lowStockItems.length}
                className="text-xs"
              >
                <Download className="w-3 h-3 mr-1 text-blue-600" /> Export Low Stock
              </Button>
            </CardHeader>
            <CardContent>
              {!inventoryData?.lowStockItems.length ? (
                <div className="py-8 text-center text-xs text-emerald-700 flex flex-col items-center justify-center border border-dashed border-emerald-200 rounded-xl bg-emerald-50">
                  <CheckCircle2 className="w-6 h-6 mb-2 text-emerald-600" />
                  All active inventory levels are above their minimum thresholds!
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Current Stock</TableHead>
                      <TableHead className="text-center">Min Threshold</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryData.lowStockItems.map((p) => (
                      <TableRow key={p.sku} className="bg-amber-50/50 hover:bg-amber-50">
                        <TableCell className="font-medium text-slate-900">{p.name}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{p.sku}</TableCell>
                        <TableCell className="text-xs text-slate-700">{p.category}</TableCell>
                        <TableCell className="text-center font-mono font-bold text-amber-700">
                          {p.currentStock} {p.unit}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-slate-500">
                          {p.minStockLevel} {p.unit}
                        </TableCell>
                        <TableCell className="text-right font-mono text-slate-700">
                          {formatINR(p.purchasePrice)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="warning">Low Stock</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PRODUCT PERFORMANCE REPORT                                         */}
      {/* ========================================================================= */}
      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top Selling Products (7 Cols) */}
            <Card className="lg:col-span-7 bg-white border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                    <TrendingUp className="w-4 h-4 text-emerald-600" /> Top-Selling Spare Parts
                  </CardTitle>
                  <CardDescription>Ranked by units sold and revenue contribution</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportTopProductsCSV}
                  disabled={!productData?.topSelling.length}
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1 text-blue-600" /> Export Top
                </Button>
              </CardHeader>
              <CardContent>
                {loadingProducts ? (
                  <div className="py-8 text-center text-slate-400">Analyzing product performance...</div>
                ) : !productData?.topSelling.length ? (
                  <EmptyState icon={Package} title="No Sales Recorded" description="Sales rankings appear after invoices are confirmed." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Part Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-center">Units Sold</TableHead>
                        <TableHead className="text-right">Revenue (INR)</TableHead>
                        <TableHead className="text-center">Invoices</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productData.topSelling.map((p, idx) => (
                        <TableRow key={p.productId} className="hover:bg-blue-50/40">
                          <TableCell className="font-bold font-mono text-blue-600 text-xs">
                            #{idx + 1}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-slate-900 block">{p.name}</span>
                            <span className="font-mono text-[10px] text-slate-500">{p.sku}</span>
                          </TableCell>
                          <TableCell className="text-xs text-slate-700">{p.category}</TableCell>
                          <TableCell className="text-center font-mono font-bold text-slate-900">
                            {p.unitsSold}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-emerald-600">
                            {formatINR(p.totalRevenue)}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs text-slate-500">
                            {p.invoiceCount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Dead Inventory / Zero Sales (5 Cols) */}
            <Card className="lg:col-span-5 bg-white border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                    <Clock className="w-4 h-4 text-slate-500" /> Non-Moving Parts (0 Sales)
                  </CardTitle>
                  <CardDescription>Catalog parts with zero recorded invoice sales</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportDeadStockCSV}
                  disabled={!productData?.leastSellingOrDeadStock.length}
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1 text-blue-600" /> Export
                </Button>
              </CardHeader>
              <CardContent>
                {loadingProducts ? (
                  <div className="py-8 text-center text-slate-400">Analyzing catalog movement...</div>
                ) : !productData?.leastSellingOrDeadStock.length ? (
                  <div className="py-8 text-center text-xs text-emerald-700 flex flex-col items-center justify-center border border-dashed border-emerald-200 rounded-xl bg-emerald-50">
                    <CheckCircle2 className="w-6 h-6 mb-2 text-emerald-600" />
                    Every product in the catalog has recorded at least one customer sale!
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part Name</TableHead>
                        <TableHead className="text-center">Holding Stock</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productData.leastSellingOrDeadStock.slice(0, 10).map((p) => (
                        <TableRow key={p.productId} className="hover:bg-blue-50/40">
                          <TableCell>
                            <span className="font-medium text-slate-900 block text-xs truncate max-w-[140px]">
                              {p.name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">{p.sku}</span>
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs text-slate-700">
                            {p.currentStock}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-slate-700">
                            {formatINR(p.sellingPrice)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GST TAX FILINGS REPORT                                             */}
      {/* ========================================================================= */}
      {activeTab === "gst" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <Card className="p-4 bg-white border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-heading">Filing Period:</span>
                <Input
                  type="date"
                  value={gstStartDate}
                  onChange={(e) => setGstStartDate(e.target.value)}
                  className="h-8 text-xs w-36 bg-white border-slate-200"
                />
                <span className="text-slate-500 text-xs">to</span>
                <Input
                  type="date"
                  value={gstEndDate}
                  onChange={(e) => setGstEndDate(e.target.value)}
                  className="h-8 text-xs w-36 bg-white border-slate-200"
                />
                <Button size="sm" variant="secondary" onClick={fetchGstReport} className="h-8 text-xs">
                  Filter
                </Button>
                {(gstStartDate || gstEndDate) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setGstStartDate("");
                      setGstEndDate("");
                    }}
                    className="h-8 text-xs text-slate-500 hover:text-slate-900"
                  >
                    Clear
                  </Button>
                )}
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={exportGstCSV}
                disabled={!gstData || !gstData.byRate.length}
                className="text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Export GST Report
              </Button>
            </div>
          </Card>

          {/* Tax Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4 bg-white border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-heading uppercase tracking-wider">
                Total Taxable Base
              </p>
              <h3 className="text-2xl font-bold font-heading text-slate-900 mt-1">
                {loadingGst ? "..." : formatINR(gstData?.summary.totalTaxable || 0)}
              </h3>
              <span className="text-[11px] text-slate-500 font-sans mt-1 block">
                Gross sales before GST
              </span>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-heading uppercase tracking-wider">
                Central GST (CGST)
              </p>
              <h3 className="text-2xl font-bold font-heading text-slate-900 mt-1">
                {loadingGst ? "..." : formatINR(gstData?.summary.totalCgst || 0)}
              </h3>
              <span className="text-[11px] text-slate-500 font-sans mt-1 block">
                Intra-state central share
              </span>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-heading uppercase tracking-wider">
                State GST (SGST)
              </p>
              <h3 className="text-2xl font-bold font-heading text-slate-900 mt-1">
                {loadingGst ? "..." : formatINR(gstData?.summary.totalSgst || 0)}
              </h3>
              <span className="text-[11px] text-slate-500 font-sans mt-1 block">
                Intra-state state share
              </span>
            </Card>

            <Card className="p-4 bg-white border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-heading uppercase tracking-wider">
                Integrated GST (IGST)
              </p>
              <h3 className="text-2xl font-bold font-heading text-slate-900 mt-1">
                {loadingGst ? "..." : formatINR(gstData?.summary.totalIgst || 0)}
              </h3>
              <span className="text-[11px] text-slate-500 font-sans mt-1 block">
                Inter-state interstate share
              </span>
            </Card>

            <Card className="p-4 bg-blue-50/70 border-blue-200 shadow-sm">
              <p className="text-xs text-blue-700 font-heading uppercase tracking-wider font-bold">
                Total GST Liability
              </p>
              <h3 className="text-2xl font-bold font-heading text-blue-600 mt-1">
                {loadingGst ? "..." : formatINR(gstData?.summary.totalGst || 0)}
              </h3>
              <span className="text-[11px] text-slate-500 font-sans mt-1 block">
                CGST + SGST + IGST
              </span>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Rate-Wise Breakdown (7 Cols) */}
            <Card className="lg:col-span-7 bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <Percent className="w-4 h-4 text-blue-600" /> Rate-Wise GST Breakdown (0%, 5%, 12%, 18%, 28%)
                </CardTitle>
                <CardDescription>Tax liabilities categorized by GST rate slab</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingGst ? (
                  <div className="py-8 text-center text-slate-400">Calculating GST breakdown...</div>
                ) : !gstData?.byRate.length ? (
                  <EmptyState icon={Receipt} title="No Tax Records" description="No taxable invoice data found." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>GST Slab</TableHead>
                        <TableHead className="text-right">Taxable Base</TableHead>
                        <TableHead className="text-right">CGST</TableHead>
                        <TableHead className="text-right">SGST</TableHead>
                        <TableHead className="text-right">IGST</TableHead>
                        <TableHead className="text-right font-bold text-blue-600">Total GST</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gstData.byRate.map((r) => (
                        <TableRow key={r.gstRate} className="hover:bg-blue-50/40">
                          <TableCell className="font-mono font-bold text-slate-900">
                            <Badge variant="secondary">{r.gstRate}% GST</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-slate-700">
                            {formatINR(r.taxableAmount)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-slate-600">
                            {formatINR(r.cgstAmount)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-slate-600">
                            {formatINR(r.sgstAmount)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-slate-600">
                            {formatINR(r.igstAmount)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-blue-600">
                            {formatINR(r.totalGst)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* State-Wise / Place of Supply (5 Cols) */}
            <Card className="lg:col-span-5 bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600" /> Place of Supply Breakdown
                </CardTitle>
                <CardDescription>Intra-State (CGST+SGST) vs Inter-State (IGST) split</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingGst ? (
                  <div className="py-8 text-center text-slate-400">Loading supply breakdown...</div>
                ) : !gstData?.byState.length ? (
                  <EmptyState icon={Receipt} title="No Supply Data" description="No transactions recorded." />
                ) : (
                  <div className="space-y-3 font-sans text-xs">
                    {gstData.byState.map((s) => (
                      <div
                        key={s.state}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 font-heading text-sm">{s.state}</span>
                          <Badge variant={s.isInterState ? "warning" : "secondary"} className="text-[10px]">
                            {s.isInterState ? "Inter-State (IGST)" : "Intra-State (CGST+SGST)"}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Invoices: {s.invoiceCount}</span>
                          <span>Taxable: {formatINR(s.taxableAmount)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-blue-600 pt-1 border-t border-slate-200">
                          <span>Total GST:</span>
                          <span className="font-mono">{formatINR(s.totalGst)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
