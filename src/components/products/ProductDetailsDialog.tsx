"use client";

import React from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IProduct } from "@/types/product.types";
import { formatINR, formatDate } from "@/lib/utils/formatters";
import {
  Package,
  Boxes,
  Tag,
  Barcode,
  Layers,
  Edit,
  Archive,
  RotateCcw,
  PlusCircle,
  Sliders,
} from "lucide-react";

interface ProductDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: IProduct | null;
  onEdit: (product: IProduct) => void;
  onStockIn: (product: IProduct) => void;
  onStockAdjust: (product: IProduct) => void;
  onToggleStatus: (product: IProduct) => void;
}

export function ProductDetailsDialog({
  isOpen,
  onClose,
  product,
  onEdit,
  onStockIn,
  onStockAdjust,
  onToggleStatus,
}: ProductDetailsDialogProps) {
  if (!product) return null;

  const isLowStock = product.currentStock > 0 && product.currentStock <= product.minStockLevel;
  const isOutOfStock = product.currentStock <= 0;
  const valuation = product.currentStock * product.purchasePrice;
  const gstAmount = (product.sellingPrice * product.gstRate) / 100;
  const retailPrice = product.sellingPrice + gstAmount;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      description={`SKU: ${product.sku} • Category: ${product.category} • Brand: ${product.brand}`}
      className="max-w-2xl"
    >
      <div className="space-y-5 pt-2">
        {/* Status and Stock Alert Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-sans">Stock Status:</span>
            {isOutOfStock ? (
              <Badge variant="danger">Out of Stock (0 {product.unit})</Badge>
            ) : isLowStock ? (
              <Badge variant="warning">
                Low Stock ({product.currentStock} {product.unit} left)
              </Badge>
            ) : (
              <Badge variant="success">
                In Stock ({product.currentStock} {product.unit})
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-sans">Catalog Status:</span>
            {product.status === "active" ? (
              <Badge variant="primary">Active</Badge>
            ) : (
              <Badge variant="secondary">Archived</Badge>
            )}
          </div>
        </div>

        {/* Technical & Commercial Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-sans">
          <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200">
            <span className="text-slate-500 block text-[11px] mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> HSN Code
            </span>
            <span className="font-semibold text-slate-900 text-sm">{product.hsn || "8708"}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200">
            <span className="text-slate-500 block text-[11px] mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-blue-600" /> GST Slab
            </span>
            <span className="font-semibold text-slate-900 text-sm">{product.gstRate}% GST</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200">
            <span className="text-slate-500 block text-[11px] mb-1 flex items-center gap-1">
              <Boxes className="w-3.5 h-3.5 text-blue-600" /> Min Stock Alert
            </span>
            <span className="font-semibold text-slate-900 text-sm">
              &le; {product.minStockLevel} {product.unit}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200">
            <span className="text-slate-500 block text-[11px] mb-1">Purchase Price</span>
            <span className="font-semibold text-slate-900 text-sm">
              {formatINR(product.purchasePrice)}
            </span>
            <span className="text-[10px] text-slate-500 block">Excl. Tax</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200">
            <span className="text-slate-500 block text-[11px] mb-1">Selling Base Price</span>
            <span className="font-semibold text-slate-900 text-sm">
              {formatINR(product.sellingPrice)}
            </span>
            <span className="text-[10px] text-slate-500 block">+ {product.gstRate}% Tax</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200">
            <span className="text-slate-500 block text-[11px] mb-1">Invoice Price (Incl. GST)</span>
            <span className="font-semibold text-blue-600 text-sm">
              {formatINR(retailPrice)}
            </span>
            <span className="text-[10px] text-slate-500 block">Tax: {formatINR(gstAmount)}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200">
            <span className="text-slate-500 block text-[11px] mb-1">Inventory Valuation</span>
            <span className="font-semibold text-emerald-600 text-sm">
              {formatINR(valuation)}
            </span>
            <span className="text-[10px] text-slate-500 block">Stock &times; Purchase</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200">
            <span className="text-slate-500 block text-[11px] mb-1 flex items-center gap-1">
              <Barcode className="w-3.5 h-3.5 text-blue-600" /> Barcode / EAN
            </span>
            <span className="font-mono text-slate-900 text-xs">
              {product.barcode || "Not configured"}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200">
            <span className="text-slate-500 block text-[11px] mb-1">Registered Date</span>
            <span className="font-semibold text-slate-700 text-xs">
              {formatDate(product.createdAt)}
            </span>
          </div>
        </div>

        {/* Quick Operational Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onClose();
                onStockIn(product);
              }}
            >
              <PlusCircle className="w-4 h-4 mr-1 text-emerald-600" /> Stock In
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onClose();
                onStockAdjust(product);
              }}
            >
              <Sliders className="w-4 h-4 mr-1 text-blue-600" /> Adjust Count
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                onClose();
                onEdit(product);
              }}
            >
              <Edit className="w-4 h-4 mr-1" /> Edit Details
            </Button>
            <Button
              size="sm"
              variant={product.status === "active" ? "danger" : "outline"}
              onClick={() => {
                onClose();
                onToggleStatus(product);
              }}
            >
              {product.status === "active" ? (
                <>
                  <Archive className="w-4 h-4 mr-1" /> Archive Part
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-1 text-emerald-600" /> Activate Part
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
