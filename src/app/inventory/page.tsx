"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { StockInDialog } from "@/components/inventory/StockInDialog";
import { StockAdjustDialog } from "@/components/inventory/StockAdjustDialog";
import { IProduct } from "@/types/product.types";
import { IStockTransaction, InventorySummary, StockMovementType } from "@/types/inventory.types";
import { formatINR, formatDateTime } from "@/lib/utils/formatters";
import {
  Boxes,
  PlusCircle,
  Sliders,
  History,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowDownRight,
  ArrowUpRight,
  Package,
} from "lucide-react";

export default function InventoryPage() {
  const { error: showError } = useToast();

  // Summary stats
  const [summary, setSummary] = useState<InventorySummary>({
    totalProducts: 0,
    activeProducts: 0,
    archivedProducts: 0,
    totalInventoryValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalUnitsInStock: 0,
  });

  // Critical stock products
  const [criticalProducts, setCriticalProducts] = useState<IProduct[]>([]);
  const [allProducts, setAllProducts] = useState<IProduct[]>([]);

  // Transactions ledger state
  const [transactions, setTransactions] = useState<IStockTransaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [movementFilter, setMovementFilter] = useState<StockMovementType | "all">("all");
  const [selectedProductId, setSelectedProductId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Modal dialog states
  const [stockInProduct, setStockInProduct] = useState<IProduct | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<IProduct | null>(null);
  const [isGeneralStockInOpen, setIsGeneralStockInOpen] = useState(false);
  const [isGeneralAdjustOpen, setIsGeneralAdjustOpen] = useState(false);

  // Fetch Inventory Summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory/summary");
      const data = await res.json();
      if (data.success) {
        setSummary(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch Critical Products (Low Stock & Out of Stock)
  const fetchCriticalProducts = useCallback(async () => {
    try {
      const [lowRes, outRes, allRes] = await Promise.all([
        fetch("/api/products?stockStatus=low_stock&limit=10"),
        fetch("/api/products?stockStatus=out_of_stock&limit=10"),
        fetch("/api/products?limit=100&status=active"),
      ]);

      const [lowData, outData, allData] = await Promise.all([
        lowRes.json(),
        outRes.json(),
        allRes.json(),
      ]);

      const critical = [
        ...(outData.data?.products || []),
        ...(lowData.data?.products || []),
      ];
      setCriticalProducts(critical);
      setAllProducts(allData.data?.products || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch Stock Transactions Ledger
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        movementType: movementFilter,
      });

      if (selectedProductId !== "all") {
        params.append("productId", selectedProductId);
      }

      const res = await fetch(`/api/inventory/transactions?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setTransactions(data.data?.transactions || []);
        setTotalTransactions(data.data?.total || 0);
        setTotalPages(data.data?.totalPages || 1);
      }
    } catch {
      showError("Failed to fetch stock transactions ledger", "Error");
    } finally {
      setIsLoading(false);
    }
  }, [page, movementFilter, selectedProductId, showError]);

  const refreshAll = useCallback(() => {
    fetchSummary();
    fetchCriticalProducts();
    fetchTransactions();
  }, [fetchSummary, fetchCriticalProducts, fetchTransactions]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const getMovementBadge = (type: StockMovementType) => {
    switch (type) {
      case "STOCK_IN":
        return <Badge variant="success">STOCK IN (+)</Badge>;
      case "ADJUSTMENT_IN":
        return <Badge variant="primary">ADJUST IN (+)</Badge>;
      case "ADJUSTMENT_OUT":
        return <Badge variant="warning">ADJUST OUT (-)</Badge>;
      case "SALE":
        return <Badge variant="secondary">SALE DEDUCT (-)</Badge>;
      case "SALE_REVERSAL":
        return <Badge variant="primary">CANCEL REVERSAL (+)</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <PageContainer
      title="Stock & Inventory Control"
      description="Record stock-in restocks, perform audited physical inventory adjustments, and trace immutable stock ledger logs."
      actions={
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              if (allProducts.length > 0) {
                setStockAdjustProduct(allProducts[0]);
              } else {
                setIsGeneralAdjustOpen(true);
              }
            }}
          >
            <Sliders className="w-4 h-4 mr-1.5 text-primary" /> Adjust Stock Count
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              if (allProducts.length > 0) {
                setStockInProduct(allProducts[0]);
              } else {
                setIsGeneralStockInOpen(true);
              }
            }}
          >
            <PlusCircle className="w-4 h-4 mr-1.5" /> Stock In
          </Button>
        </div>
      }
    >
      {/* Top 4 Inventory Valuation & Health Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Valuation */}
        <Card glowOnHover className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-emerald-500/20">
            <TrendingUp className="w-8 h-8" />
          </div>
          <p className="text-xs font-semibold text-slate-500 font-heading uppercase tracking-wider">
            Total Inventory Valuation
          </p>
          <h3 className="text-2xl font-bold font-heading text-emerald-600 mt-1">
            {formatINR(summary.totalInventoryValue)}
          </h3>
          <p className="text-[11px] text-slate-500 font-sans mt-2">
            Based on active purchase costs
          </p>
        </Card>

        {/* Total Physical Units */}
        <Card glowOnHover className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-blue-500/20">
            <Boxes className="w-8 h-8" />
          </div>
          <p className="text-xs font-semibold text-slate-500 font-heading uppercase tracking-wider">
            Total Units in Stock
          </p>
          <h3 className="text-2xl font-bold font-heading text-slate-900 mt-1">
            {summary.totalUnitsInStock}
          </h3>
          <p className="text-[11px] text-slate-500 font-sans mt-2">
            Across {summary.activeProducts} active parts
          </p>
        </Card>

        {/* Low Stock Alert */}
        <Card
          glowOnHover
          className={`relative overflow-hidden border ${
            summary.lowStockCount > 0
              ? "border-amber-300 bg-amber-50/50"
              : "border-surface-border"
          }`}
        >
          <div className="absolute top-0 right-0 p-3 text-amber-500/30">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <p className="text-xs font-semibold text-amber-700 font-heading uppercase tracking-wider">
            Low Stock Alerts
          </p>
          <h3 className="text-2xl font-bold font-heading text-amber-700 mt-1">
            {summary.lowStockCount}
          </h3>
          <p className="text-[11px] text-slate-500 font-sans mt-2">
            Parts &le; minimum threshold
          </p>
        </Card>

        {/* Out of Stock Alert */}
        <Card
          glowOnHover
          className={`relative overflow-hidden border ${
            summary.outOfStockCount > 0
              ? "border-rose-300 bg-rose-50/50"
              : "border-surface-border"
          }`}
        >
          <div className="absolute top-0 right-0 p-3 text-rose-500/30">
            <XCircle className="w-8 h-8" />
          </div>
          <p className="text-xs font-semibold text-rose-700 font-heading uppercase tracking-wider">
            Out of Stock Parts
          </p>
          <h3 className="text-2xl font-bold font-heading text-rose-700 mt-1">
            {summary.outOfStockCount}
          </h3>
          <p className="text-[11px] text-slate-500 font-sans mt-2">
            Parts with 0 recorded inventory
          </p>
        </Card>
      </div>

      {/* Critical Stock Alerts Grid (Low & Out of Stock) */}
      {criticalProducts.length > 0 && (
        <Card className="border-amber-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-amber-800 flex items-center gap-2 text-base">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Critical Stock Attention Required ({criticalProducts.length})
              </CardTitle>
              <CardDescription>
                These parts require immediate restock or supplier purchase orders.
              </CardDescription>
            </div>
            <Badge variant="warning">Action Needed</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {criticalProducts.map((p) => {
                const isZero = p.currentStock <= 0;
                return (
                  <div
                    key={p._id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 text-xs font-sans shadow-sm ${
                      isZero
                        ? "border-rose-200 bg-rose-50/50"
                        : "border-amber-200 bg-amber-50/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-[11px] font-bold text-slate-600">
                          {p.sku}
                        </span>
                        {isZero ? (
                          <Badge variant="danger">0 Left</Badge>
                        ) : (
                          <Badge variant="warning">
                            {p.currentStock} / {p.minStockLevel} {p.unit}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-heading font-semibold text-slate-900 text-sm truncate">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {p.brand} • {p.category}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                      <Button
                        size="sm"
                        variant="primary"
                        className="w-full text-xs"
                        onClick={() => setStockInProduct(p)}
                      >
                        <PlusCircle className="w-3.5 h-3.5 mr-1" /> Restock Part
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs bg-white"
                        onClick={() => setStockAdjustProduct(p)}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Transaction Ledger Card */}
      <Card className="p-0 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold font-heading text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" /> Immutable Stock Movement Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-sans">
              Complete audit history of stock additions, count adjustments, sales, and reversals.
            </p>
          </div>

          {/* Movement Type & Product Filter */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter by Product */}
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setPage(1);
              }}
              className="h-9 bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-2.5 focus:outline-none focus:border-primary max-w-[180px] truncate shadow-sm"
            >
              <option value="all">All Parts</option>
              {allProducts.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.sku} - {p.name}
                </option>
              ))}
            </select>

            {/* Filter by Movement Type */}
            <select
              value={movementFilter}
              onChange={(e) => {
                setMovementFilter(e.target.value as StockMovementType | "all");
                setPage(1);
              }}
              className="h-9 bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-2.5 focus:outline-none focus:border-primary shadow-sm"
            >
              <option value="all">All Movements</option>
              <option value="STOCK_IN">STOCK IN (+)</option>
              <option value="ADJUSTMENT_IN">ADJUSTMENT IN (+)</option>
              <option value="ADJUSTMENT_OUT">ADJUSTMENT OUT (-)</option>
              <option value="SALE">SALE (-)</option>
              <option value="SALE_REVERSAL">SALE REVERSAL (+)</option>
            </select>

            <button
              onClick={fetchTransactions}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
              title="Refresh Ledger"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading transaction ledger...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={History}
              title="No Stock Movements Recorded"
              description="Every stock addition, physical count adjustment, or invoice sale will be immutably recorded here."
              actionLabel="Add Initial Stock"
              onAction={() => {
                if (allProducts.length > 0) setStockInProduct(allProducts[0]);
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Part / SKU</TableHead>
                  <TableHead>Movement Type</TableHead>
                  <TableHead>Change Qty</TableHead>
                  <TableHead>Previous &rarr; New Stock</TableHead>
                  <TableHead>Audit Reason</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => {
                  const isPositive =
                    t.movementType === "STOCK_IN" ||
                    t.movementType === "ADJUSTMENT_IN" ||
                    t.movementType === "SALE_REVERSAL";

                  return (
                    <TableRow key={t._id}>
                      {/* Date */}
                      <TableCell className="text-xs text-slate-500 font-sans whitespace-nowrap">
                        {formatDateTime(t.createdDate)}
                      </TableCell>

                      {/* Product Name & SKU */}
                      <TableCell className="max-w-xs">
                        <span className="font-heading font-semibold text-slate-900 block truncate">
                          {t.productName}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 block">
                          {t.productSku}
                        </span>
                      </TableCell>

                      {/* Movement Badge */}
                      <TableCell>{getMovementBadge(t.movementType)}</TableCell>

                      {/* Quantity */}
                      <TableCell>
                        <span
                          className={`font-semibold text-xs flex items-center gap-1 font-mono ${
                            isPositive ? "text-emerald-700" : "text-amber-800"
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                          {isPositive ? `+${t.quantity}` : `-${t.quantity}`}
                        </span>
                      </TableCell>

                      {/* Previous to New Stock */}
                      <TableCell className="font-mono text-xs text-slate-600">
                        {t.previousQuantity} &rarr;{" "}
                        <span className="font-semibold text-slate-900">{t.newQuantity}</span>
                      </TableCell>

                      {/* Reason */}
                      <TableCell className="text-xs text-slate-700 max-w-xs font-sans">
                        {t.reason}
                      </TableCell>

                      {/* Reference */}
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {t.reference || "N/A"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-sans">
            <div>
              Showing page <span className="text-slate-900 font-semibold">{page}</span> of{" "}
              <span className="text-slate-900 font-semibold">{totalPages}</span> ({totalTransactions}{" "}
              total movements)
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Direct Modal Triggers */}
      <StockInDialog
        isOpen={!!stockInProduct}
        onClose={() => setStockInProduct(null)}
        onSuccess={refreshAll}
        product={stockInProduct}
      />

      <StockAdjustDialog
        isOpen={!!stockAdjustProduct}
        onClose={() => setStockAdjustProduct(null)}
        onSuccess={refreshAll}
        product={stockAdjustProduct}
      />
    </PageContainer>
  );
}
