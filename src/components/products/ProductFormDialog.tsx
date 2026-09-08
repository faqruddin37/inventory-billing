"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { IProduct, GSTPercentage, ProductUnit } from "@/types/product.types";
import { formatINR } from "@/lib/utils/formatters";
import { Package, Plus, Calculator } from "lucide-react";

interface ProductFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: IProduct | null;
  categories: { _id: string; name: string }[];
  onAddCategoryClick?: () => void;
}

const GST_OPTIONS: GSTPercentage[] = [0, 5, 12, 18, 28];
const UNIT_OPTIONS: ProductUnit[] = ["pcs", "ltr", "set", "box", "kg", "meter", "pair", "unit"];

export function ProductFormDialog({
  isOpen,
  onClose,
  onSuccess,
  productToEdit,
  categories,
  onAddCategoryClick,
}: ProductFormDialogProps) {
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    brand: "",
    hsn: "",
    purchasePrice: 0,
    sellingPrice: 0,
    gstRate: 18 as GSTPercentage,
    currentStock: 0,
    minStockLevel: 5,
    unit: "pcs",
    barcode: "",
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || "",
        sku: productToEdit.sku || "",
        category: productToEdit.category || (categories[0]?.name || ""),
        brand: productToEdit.brand || "",
        hsn: productToEdit.hsn || "",
        purchasePrice: productToEdit.purchasePrice || 0,
        sellingPrice: productToEdit.sellingPrice || 0,
        gstRate: productToEdit.gstRate || 18,
        currentStock: productToEdit.currentStock || 0,
        minStockLevel: productToEdit.minStockLevel ?? 5,
        unit: productToEdit.unit || "pcs",
        barcode: productToEdit.barcode || "",
      });
    } else {
      setFormData({
        name: "",
        sku: "",
        category: categories[0]?.name || "Spare Parts",
        brand: "",
        hsn: "8708",
        purchasePrice: 0,
        sellingPrice: 0,
        gstRate: 18,
        currentStock: 0,
        minStockLevel: 5,
        unit: "pcs",
        barcode: "",
      });
    }
  }, [productToEdit, isOpen, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = productToEdit ? `/api/products/${productToEdit._id}` : "/api/products";
      const method = productToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showError(data.message || "Failed to save product", "Save Failed");
        return;
      }

      success(
        productToEdit ? "Product details updated successfully" : "New product registered in catalog",
        "Success"
      );
      onSuccess();
      onClose();
    } catch {
      showError("Connection error while saving product", "Error");
    } finally {
      setIsLoading(false);
    }
  };

  // Live GST calculation breakdown
  const gstAmount = (formData.sellingPrice * formData.gstRate) / 100;
  const totalPriceWithGst = Number(formData.sellingPrice) + gstAmount;
  const margin =
    formData.purchasePrice > 0
      ? ((formData.sellingPrice - formData.purchasePrice) / formData.purchasePrice) * 100
      : 0;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? "Edit Automotive Part" : "Register New Spare Part"}
      description={
        productToEdit
          ? `Updating details for SKU: ${productToEdit.sku}`
          : "Add an automotive spare part with HSN, GST slab, pricing, and initial stock."
      }
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Part Name */}
          <div className="sm:col-span-2">
            <Input
              label="Part / Product Name *"
              placeholder="e.g., Bosch Front Brake Pad Set"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              leftIcon={<Package className="w-4 h-4" />}
            />
          </div>

          {/* SKU Code */}
          <div>
            <Input
              label="SKU / Part Number *"
              placeholder="e.g., BP-BSH-001"
              required
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              helperText="Unique code for fast billing"
            />
          </div>

          {/* Brand */}
          <div>
            <Input
              label="Brand / Manufacturer *"
              placeholder="e.g., Bosch, Castrol, Brembo"
              required
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            />
          </div>

          {/* Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">Category *</label>
              {onAddCategoryClick && (
                <button
                  type="button"
                  onClick={onAddCategoryClick}
                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5 font-semibold"
                >
                  <Plus className="w-3 h-3" /> New
                </button>
              )}
            </div>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
            >
              {categories.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
              {categories.length === 0 && <option value="Spare Parts">Spare Parts</option>}
            </select>
          </div>

          {/* HSN Code */}
          <div>
            <Input
              label="HSN Code *"
              placeholder="e.g., 8708 for auto parts"
              required
              value={formData.hsn}
              onChange={(e) => setFormData({ ...formData, hsn: e.target.value })}
            />
          </div>

          {/* Unit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Unit of Measure *</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {u.toUpperCase()} ({u})
                </option>
              ))}
            </select>
          </div>

          {/* GST Percentage */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">GST Rate Slab *</label>
            <select
              value={formData.gstRate}
              onChange={(e) =>
                setFormData({ ...formData, gstRate: Number(e.target.value) as GSTPercentage })
              }
              className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
            >
              {GST_OPTIONS.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}% GST {rate === 18 ? "(Automotive standard)" : rate === 28 ? "(Automotive premium)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Purchase Price */}
          <div>
            <Input
              label="Purchase Price (₹, Excl. Tax) *"
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.purchasePrice || ""}
              onChange={(e) =>
                setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          {/* Selling Price */}
          <div>
            <Input
              label="Selling Price (₹, Base) *"
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.sellingPrice || ""}
              onChange={(e) =>
                setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          {/* Initial Stock (Only during creation) */}
          {!productToEdit ? (
            <div>
              <Input
                label="Initial Stock Quantity"
                type="number"
                min="0"
                value={formData.currentStock || ""}
                onChange={(e) =>
                  setFormData({ ...formData, currentStock: parseInt(e.target.value, 10) || 0 })
                }
                helperText="Will be logged as Initial Stock In"
              />
            </div>
          ) : (
            <div>
              <Input
                label="Current Stock Quantity"
                value={`${productToEdit.currentStock} ${productToEdit.unit}`}
                disabled
                helperText="Use Stock Adjustment to update current count"
              />
            </div>
          )}

          {/* Minimum Stock Level */}
          <div>
            <Input
              label="Minimum Stock Alert Level *"
              type="number"
              min="0"
              required
              value={formData.minStockLevel || ""}
              onChange={(e) =>
                setFormData({ ...formData, minStockLevel: parseInt(e.target.value, 10) || 0 })
              }
              helperText="Low-stock badge triggers at or below this"
            />
          </div>

          {/* Barcode (Optional) */}
          <div className="sm:col-span-2">
            <Input
              label="Barcode / EAN (Optional)"
              placeholder="e.g., 8901234567890"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            />
          </div>
        </div>

        {/* GST & Margin Preview Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-blue-600 font-semibold font-heading">
            <Calculator className="w-3.5 h-3.5" /> Price & Tax Summary
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 pt-1 font-sans">
            <div>
              <span className="text-slate-500 block text-[10px]">Base Price:</span>
              <span className="font-semibold text-slate-900">{formatINR(formData.sellingPrice)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">GST ({formData.gstRate}%):</span>
              <span className="font-semibold text-slate-900">{formatINR(gstAmount)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Est. Retail / Invoice:</span>
              <span className="font-semibold text-blue-600">{formatINR(totalPriceWithGst)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Est. Markup:</span>
              <span
                className={`font-semibold ${
                  margin >= 0 ? "text-emerald-700" : "text-rose-600"
                }`}
              >
                {margin.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {productToEdit ? "Update Product" : "Save to Catalog"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
