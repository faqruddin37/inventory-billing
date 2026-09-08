"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SalesAreaChart } from "@/components/dashboard/SalesAreaChart";
import { DashboardData } from "@/services/dashboard.service";
import { formatINR, formatDate, formatDateTime } from "@/lib/utils/formatters";
import {
  IndianRupee,
  Receipt,
  Package,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  Boxes,
  BarChart3,
  Clock,
  Sparkles,
  XCircle,
  CheckCircle2,
  Sliders,
  PlusCircle,
  Eye,
  Layers,
} from "lucide-react";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [chartPeriod, setChartPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/dashboard/stats?chartPeriod=${chartPeriod}`);
      const json = await res.json();
      if (json.success && json.data) {
        setDashboardData(json.data);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [chartPeriod]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const metrics = dashboardData?.metrics || {
    todaySales: 0,
    thisMonthSales: 0,
    totalInvoices: 0,
    totalProducts: 0,
    inventoryValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalGstCollected: 0,
  };

  return (
    <PageContainer
      title="Workshop Dashboard"
      description="Real-time overview of automotive inventory, stock levels, GST collections, and billing turnover."
      actions={
        <div className="flex items-center gap-2.5">
          <Link href="/billing">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-1.5" /> Create Invoice
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="secondary" size="md">
              <Package className="w-4 h-4 mr-1.5 text-primary" /> Add Part
            </Button>
          </Link>
        </div>
      }
    >
      {/* 8 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Sales */}
        <Card glowOnHover className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-blue-500/20">
            <IndianRupee className="w-7 h-7" />
          </div>
          <p className="text-xs font-semibold text-slate-500 font-heading uppercase tracking-wider">
            Today's Sales
          </p>
          <h3 className="text-2xl font-bold font-heading text-slate-900 mt-1">
            {isLoading ? "..." : formatINR(metrics.todaySales)}
          </h3>
          <div className="flex items-center gap-1.5 mt-2">
            <Badge variant="secondary" className="text-[10px]">
              <Clock className="w-3 h-3 text-slate-500" /> Today
            </Badge>
          </div>
        </Card>

        {/* Card 2: This Month's Sales */}
        <Card glowOnHover className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-emerald-500/20">
            <TrendingUp className="w-7 h-7" />
          </div>
          <p className="text-xs font-semibold text-slate-500 font-heading uppercase tracking-wider">
            This Month's Sales
          </p>
          <h3 className="text-2xl font-bold font-heading text-emerald-600 mt-1">
            {isLoading ? "..." : formatINR(metrics.thisMonthSales)}
          </h3>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[11px] text-slate-500 font-sans">Month-to-date turnover</span>
          </div>
        </Card>

        {/* Card 3: Total Invoices */}
        <Card glowOnHover className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-blue-500/20">
            <Receipt className="w-7 h-7" />
          </div>
          <p className="text-xs font-semibold text-slate-500 font-heading uppercase tracking-wider">
            Total Invoices
          </p>
          <h3 className="text-2xl font-bold font-heading text-slate-900 mt-1">
            {isLoading ? "..." : metrics.totalInvoices}
          </h3>
          <div className="flex items-center gap-1.5 mt-2">
            <Link href="/invoices" className="text-[11px] text-blue-600 font-medium hover:underline flex items-center">
              View Bills <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </Card>

        {/* Card 4: Total Active Products */}
        <Card glowOnHover className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-blue-500/20">
            <Package className="w-7 h-7" />
          </div>
          <p className="text-xs font-semibold text-slate-500 font-heading uppercase tracking-wider">
            Active Spare Parts
          </p>
          <h3 className="text-2xl font-bold font-heading text-slate-900 mt-1">
            {isLoading ? "..." : metrics.totalProducts}
          </h3>
          <div className="flex items-center gap-1.5 mt-2">
            <Link href="/products" className="text-[11px] text-blue-600 font-medium hover:underline flex items-center">
              Parts Catalog <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </Card>

        {/* Card 5: Inventory Valuation */}
        <Card glowOnHover className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-emerald-500/20">
            <Boxes className="w-7 h-7" />
          </div>
          <p className="text-xs font-semibold text-slate-500 font-heading uppercase tracking-wider">
            Inventory Valuation
          </p>
          <h3 className="text-2xl font-bold font-heading text-emerald-600 mt-1">
            {isLoading ? "..." : formatINR(metrics.inventoryValue)}
          </h3>
          <div className="flex items-center gap-1.5 mt-2">
            <Link href="/inventory" className="text-[11px] text-emerald-600 font-medium hover:underline flex items-center">
              Stock details <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </Card>

        {/* Card 6: Low Stock Count */}
        <Card
          glowOnHover
          className={`relative overflow-hidden border ${
            metrics.lowStockCount > 0
              ? "border-amber-300 bg-amber-50/50"
              : "border-surface-border"
          }`}
        >
          <div className="absolute top-0 right-0 p-3 text-amber-500/30">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <p className="text-xs font-semibold text-amber-700 font-heading uppercase tracking-wider">
            Low Stock Alert
          </p>
          <h3 className="text-2xl font-bold font-heading text-amber-700 mt-1">
            {isLoading ? "..." : metrics.lowStockCount}
          </h3>
          <div className="flex items-center gap-1.5 mt-2">
            <Link href="/inventory" className="text-[11px] text-amber-700 font-medium hover:underline flex items-center">
              Restock needed <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </Card>

        {/* Card 7: Out of Stock Count */}
        <Card
          glowOnHover
          className={`relative overflow-hidden border ${
            metrics.outOfStockCount > 0
              ? "border-rose-300 bg-rose-50/50"
              : "border-surface-border"
          }`}
        >
          <div className="absolute top-0 right-0 p-3 text-rose-500/30">
            <XCircle className="w-7 h-7" />
          </div>
          <p className="text-xs font-semibold text-rose-700 font-heading uppercase tracking-wider">
            Out of Stock Parts
          </p>
          <h3 className="text-2xl font-bold font-heading text-rose-700 mt-1">
            {isLoading ? "..." : metrics.outOfStockCount}
          </h3>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[11px] text-slate-500 font-sans">0 recorded stock</span>
          </div>
        </Card>

        {/* Card 8: GST Collected */}
        <Card glowOnHover className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-blue-500/20">
            <Receipt className="w-7 h-7" />
          </div>
          <p className="text-xs font-semibold text-slate-500 font-heading uppercase tracking-wider">
            Total GST Collected
          </p>
          <h3 className="text-2xl font-bold font-heading text-blue-600 mt-1">
            {isLoading ? "..." : formatINR(metrics.totalGstCollected)}
          </h3>
          <div className="flex items-center gap-1.5 mt-2">
            <Link href="/reports" className="text-[11px] text-blue-600 font-medium hover:underline flex items-center">
              GST breakdown <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Business Insights Banner */}
      {dashboardData?.insights && dashboardData.insights.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-blue-50/80 via-white to-sky-50/80 border-blue-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
                  Automotive Business Insights
                </span>
                <p className="text-xs text-slate-600 font-sans">
                  {dashboardData.insights.join(" • ")}
                </p>
              </div>
            </div>

            <Link href="/reports">
              <Button size="sm" variant="outline" className="text-xs flex-shrink-0 bg-white">
                Full Reports <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Main Row: Sales Turnover Chart & GST Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Sales Chart */}
        <Card className="lg:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" /> Sales Turnover & Billing Activity
              </CardTitle>
              <CardDescription>
                Interactive revenue trend visualization from confirmed customer invoices.
              </CardDescription>
            </div>

            {/* Period Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setChartPeriod("daily")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  chartPeriod === "daily"
                    ? "bg-white text-blue-600 font-bold shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setChartPeriod("weekly")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  chartPeriod === "weekly"
                    ? "bg-white text-blue-600 font-bold shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setChartPeriod("monthly")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  chartPeriod === "monthly"
                    ? "bg-white text-blue-600 font-bold shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Monthly
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <SalesAreaChart
              data={dashboardData?.salesChart || []}
              period={chartPeriod}
            />
          </CardContent>
        </Card>

        {/* Right 4 Cols: GST Summary Card & Quick Links */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" /> GST Tax Liability Summary
              </CardTitle>
              <CardDescription>Calculated tax totals ready for GST filing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 font-sans text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Central GST (CGST):</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatINR(dashboardData?.gstSummary.totalCgst || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">State GST (SGST):</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatINR(dashboardData?.gstSummary.totalSgst || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Integrated GST (IGST):</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatINR(dashboardData?.gstSummary.totalIgst || 0)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-blue-600 font-heading">
                  <span>Total Tax Liability:</span>
                  <span className="font-mono">
                    {formatINR(dashboardData?.gstSummary.totalGst || 0)}
                  </span>
                </div>
              </div>

              <Link href="/reports">
                <Button size="sm" variant="outline" className="w-full text-xs">
                  View Detailed Tax Reports
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Row: Top Selling Parts & Low Stock Alert List & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Selling Products (4 Cols) */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Top-Selling Spare Parts
            </CardTitle>
            <CardDescription>Most frequently billed items</CardDescription>
          </CardHeader>
          <CardContent>
            {(!dashboardData?.topProducts || dashboardData.topProducts.length === 0) ? (
              <EmptyState
                icon={Package}
                title="No Sales Recorded"
                description="Fast-moving parts will appear here as bills are confirmed."
              />
            ) : (
              <div className="space-y-2.5">
                {dashboardData.topProducts.map((p, idx) => (
                  <div
                    key={p.productId}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs font-sans"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center flex-shrink-0 font-heading">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 block truncate">{p.name}</span>
                        <span className="font-mono text-[10px] text-slate-500">{p.sku}</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-bold text-slate-900 block font-mono">
                        {p.quantitySold} sold
                      </span>
                      <span className="text-[10px] text-emerald-600 font-mono font-semibold">
                        {formatINR(p.totalRevenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts (4 Cols) */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Low Stock Action List
            </CardTitle>
            <CardDescription>Parts at or below alert threshold</CardDescription>
          </CardHeader>
          <CardContent>
            {(!dashboardData?.lowStockProducts || dashboardData.lowStockProducts.length === 0) ? (
              <div className="py-8 text-center text-xs text-emerald-700 flex flex-col items-center justify-center border border-dashed border-emerald-300 rounded-xl bg-emerald-50/50">
                <CheckCircle2 className="w-6 h-6 mb-2 text-emerald-600" />
                All active inventory stock levels are healthy!
              </div>
            ) : (
              <div className="space-y-2.5">
                {dashboardData.lowStockProducts.map((p) => (
                  <div
                    key={p._id}
                    className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs font-sans"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900 block truncate">{p.name}</span>
                      <span className="font-mono text-[10px] text-amber-700 font-medium">
                        Stock: {p.currentStock} / Min: {p.minStockLevel} {p.unit}
                      </span>
                    </div>

                    <Link href="/inventory">
                      <Button size="sm" variant="outline" className="text-[11px] h-7 px-2 bg-white">
                        Restock
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices (4 Cols) */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" /> Recent Invoices
              </CardTitle>
              <CardDescription>Latest generated bills</CardDescription>
            </div>
            <Link href="/invoices">
              <Button size="sm" variant="ghost" className="text-xs">
                All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {(!dashboardData?.recentInvoices || dashboardData.recentInvoices.length === 0) ? (
              <EmptyState
                icon={Receipt}
                title="No Invoices Yet"
                description="Recent invoices will appear here as bills are created."
              />
            ) : (
              <div className="space-y-2.5">
                {dashboardData.recentInvoices.map((inv) => (
                  <Link
                    key={inv._id}
                    href={`/invoices/${inv._id}`}
                    className="p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 flex items-center justify-between text-xs font-sans transition-colors block group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-blue-600 group-hover:underline">
                          {inv.invoiceNumber}
                        </span>
                        <Badge
                          variant={inv.status === "confirmed" ? "success" : "danger"}
                          className="text-[9px] py-0 px-1.5"
                        >
                          {inv.status}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {inv.customerName} • {inv.itemCount} items
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-slate-900 font-mono block">
                        {formatINR(inv.grandTotal)}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatDate(inv.invoiceDate)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
