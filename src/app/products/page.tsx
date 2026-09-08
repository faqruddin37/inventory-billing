"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { ProductFormDialog } from "@/components/products/ProductFormDialog";
import { ProductDetailsDialog } from "@/components/products/ProductDetailsDialog";
import { CategoryManagerDialog } from "@/components/categories/CategoryManagerDialog";
import { StockInDialog } from "@/components/inventory/StockInDialog";
import { StockAdjustDialog } from "@/components/inventory/StockAdjustDialog";
import { IProduct } from "@/types/product.types";
import { formatINR, formatDate } from "@/lib/utils/formatters";
import {
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Layers,
  Archive,
  RotateCcw,
  Edit,
  Eye,
  PlusCircle,
  Sliders,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Boxes,
} from "lucide-react";

export default function ProductsPage() {
  const { success, error: showError } = useToast();

  // Data states
  const [products, setProducts] = useState<IProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("active");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "name" | "currentStock" | "sellingPrice" | "sku">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Dynamic filter options
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [viewingProduct, setViewingProduct] = useState<IProduct | null>(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [stockInProduct, setStockInProduct] = useState<IProduct | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<IProduct | null>(null);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        status: statusFilter,
        stockStatus: stockStatusFilter,
        sortBy,
        sortOrder,
      });

      if (search.trim()) params.append("search", search.trim());
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (selectedBrand !== "all") params.append("brand", selectedBrand);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setProducts(data.data?.products || []);
        setTotal(data.data?.total || 0);
        setTotalPages(data.data?.totalPages || 1);
        if (data.data?.availableBrands) setBrands(data.data.availableBrands);
      }
    } catch {
      showError("Failed to load products", "Connection Error");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, stockStatusFilter, sortBy, sortOrder, search, selectedCategory, selectedBrand, showError]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories?status=active");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Toggle active / archived state
  const handleToggleStatus = async (product: IProduct) => {
    const targetStatus = product.status === "active" ? "archived" : "active";
    try {
      const res = await fetch(`/api/products/${product._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showError(data.message || "Failed to change status", "Error");
        return;
      }

      success(
        `Product "${product.name}" ${targetStatus === "active" ? "activated" : "archived"}`,
        "Status Updated"
      );
      fetchProducts();
    } catch {
      showError("Connection error during status update", "Error");
    }
  };

  return (
    <PageContainer
      title="Automotive Parts Catalog"
      description="Manage spare parts inventory, SKUs, GST slabs, pricing, and stock status."
      actions={
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setIsCategoryManagerOpen(true)}
          >
            <Layers className="w-4 h-4 mr-1.5 text-primary" /> Categories
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingProduct(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Part
          </Button>
        </div>
      }
    >
      {/* Search & Filter Controls Bar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by Name, SKU, Brand, HSN, Barcode..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 bg-surface-muted border border-surface-border text-foreground text-xs rounded-lg px-3 focus:outline-none focus:border-primary"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 focus:outline-none focus:border-primary shadow-sm"
            >
              <option value="all">All Brands</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-") as [
                  typeof sortBy,
                  typeof sortOrder
                ];
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full h-10 bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 focus:outline-none focus:border-primary shadow-sm"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="name-asc">Name (A - Z)</option>
              <option value="name-desc">Name (Z - A)</option>
              <option value="currentStock-asc">Stock: Low to High</option>
              <option value="currentStock-desc">Stock: High to Low</option>
              <option value="sellingPrice-desc">Price: High to Low</option>
              <option value="sellingPrice-asc">Price: Low to High</option>
            </select>
          </div>
        </div>

        {/* Status Tabs and Quick Stock Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs font-sans">
          {/* Stock Condition Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 mr-1 flex items-center gap-1 font-semibold">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Stock:
            </span>
            <button
              onClick={() => {
                setStockStatusFilter("all");
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                stockStatusFilter === "all"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Levels
            </button>
            <button
              onClick={() => {
                setStockStatusFilter("in_stock");
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                stockStatusFilter === "in_stock"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => {
                setStockStatusFilter("low_stock");
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                stockStatusFilter === "low_stock"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              Low Stock Alert
            </button>
            <button
              onClick={() => {
                setStockStatusFilter("out_of_stock");
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                stockStatusFilter === "out_of_stock"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              Out of Stock
            </button>
          </div>

          {/* Catalog State Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setStatusFilter("active");
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                statusFilter === "active"
                  ? "bg-blue-50 text-blue-700 border border-blue-300 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Active Catalog
            </button>
            <button
              onClick={() => {
                setStatusFilter("archived");
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                statusFilter === "archived"
                  ? "bg-blue-50 text-blue-700 border border-blue-300 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Archived Parts
            </button>
            <button
              onClick={fetchProducts}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 ml-1"
              title="Refresh Products"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </Card>

      {/* Product Catalog Table */}
      <Card className="p-0 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading spare parts catalog...
          </div>
        ) : products.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Package}
              title={
                search || selectedCategory !== "all" || stockStatusFilter !== "all"
                  ? "No matching parts found"
                  : "No Spare Parts Registered"
              }
              description={
                search || selectedCategory !== "all" || stockStatusFilter !== "all"
                  ? "Try clearing or adjusting your search filters above."
                  : "Register your workshop spare parts, oils, filters, and accessories to start inventory tracking."
              }
              actionLabel={
                search || selectedCategory !== "all" || stockStatusFilter !== "all"
                  ? "Clear Filters"
                  : "Add First Part"
              }
              onAction={() => {
                if (search || selectedCategory !== "all" || stockStatusFilter !== "all") {
                  setSearch("");
                  setSelectedCategory("all");
                  setSelectedBrand("all");
                  setStockStatusFilter("all");
                } else {
                  setEditingProduct(null);
                  setIsFormOpen(true);
                }
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part / Product</TableHead>
                  <TableHead>SKU / Code</TableHead>
                  <TableHead>Category / Brand</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Selling Base</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const isOutOfStock = p.currentStock <= 0;
                  const isLowStock = p.currentStock > 0 && p.currentStock <= p.minStockLevel;

                  return (
                    <TableRow key={p._id}>
                      {/* Product Name */}
                      <TableCell className="font-medium text-slate-900 max-w-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100 shadow-sm">
                            <Package className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span
                              onClick={() => setViewingProduct(p)}
                              className="font-heading font-semibold text-slate-900 hover:text-blue-600 cursor-pointer truncate block"
                            >
                              {p.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-sans block">
                              HSN: {p.hsn || "8708"} {p.barcode ? `• ${p.barcode}` : ""}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* SKU */}
                      <TableCell>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                          {p.sku}
                        </span>
                      </TableCell>

                      {/* Category & Brand */}
                      <TableCell>
                        <span className="text-xs text-slate-800 block font-sans font-medium">{p.category}</span>
                        <span className="text-[11px] text-slate-500 block font-sans">{p.brand}</span>
                      </TableCell>

                      {/* Stock Status */}
                      <TableCell>
                        {isOutOfStock ? (
                          <Badge variant="danger">0 {p.unit} (Out of Stock)</Badge>
                        ) : isLowStock ? (
                          <Badge variant="warning">
                            {p.currentStock} {p.unit} (Low Stock &le; {p.minStockLevel})
                          </Badge>
                        ) : (
                          <Badge variant="success">
                            {p.currentStock} {p.unit}
                          </Badge>
                        )}
                      </TableCell>

                      {/* Purchase Price */}
                      <TableCell className="text-xs text-slate-600 font-sans">
                        {formatINR(p.purchasePrice)}
                      </TableCell>

                      {/* Selling Price */}
                      <TableCell className="text-xs font-bold text-slate-900 font-sans">
                        {formatINR(p.sellingPrice)}
                      </TableCell>

                      {/* GST */}
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-[11px]">
                          {p.gstRate}%
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Details */}
                          <button
                            onClick={() => setViewingProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                            title="View Specifications"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Stock In */}
                          <button
                            onClick={() => setStockInProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-md hover:bg-slate-100 transition-colors"
                            title="Stock In (+)"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>

                          {/* Quick Stock Adjust */}
                          <button
                            onClick={() => setStockAdjustProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 transition-colors"
                            title="Adjust Physical Count"
                          >
                            <Sliders className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                            title="Edit Part"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Archive / Activate */}
                          <button
                            onClick={() => handleToggleStatus(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                            title={p.status === "active" ? "Archive Part" : "Activate Part"}
                          >
                            {p.status === "active" ? (
                              <Archive className="w-4 h-4" />
                            ) : (
                              <RotateCcw className="w-4 h-4 text-emerald-600" />
                            )}
                          </button>
                        </div>
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
              <span className="text-slate-900 font-semibold">{totalPages}</span> ({total} total parts)
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

      {/* Modals */}
      <ProductFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchProducts}
        productToEdit={editingProduct}
        categories={categories}
        onAddCategoryClick={() => setIsCategoryManagerOpen(true)}
      />

      <ProductDetailsDialog
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        product={viewingProduct}
        onEdit={(prod) => {
          setEditingProduct(prod);
          setIsFormOpen(true);
        }}
        onStockIn={(prod) => setStockInProduct(prod)}
        onStockAdjust={(prod) => setStockAdjustProduct(prod)}
        onToggleStatus={handleToggleStatus}
      />

      <CategoryManagerDialog
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        onCategoriesChanged={() => {
          fetchCategories();
          fetchProducts();
        }}
      />

      <StockInDialog
        isOpen={!!stockInProduct}
        onClose={() => setStockInProduct(null)}
        onSuccess={fetchProducts}
        product={stockInProduct}
      />

      <StockAdjustDialog
        isOpen={!!stockAdjustProduct}
        onClose={() => setStockAdjustProduct(null)}
        onSuccess={fetchProducts}
        product={stockAdjustProduct}
      />
    </PageContainer>
  );
}
