"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { IProduct } from "@/types/product.types";
import { PlusCircle, ArrowUpRight } from "lucide-react";

interface StockInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: IProduct | null;
}

export function StockInDialog({ isOpen, onClose, onSuccess, product }: StockInDialogProps) {
  const { success, error: showError } = useToast();
  const [quantity, setQuantity] = useState<number | "">("");
  const [reason, setReason] = useState("Supplier Purchase Restock");
  const [reference, setReference] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!product) return null;

  const qtyNumber = typeof quantity === "number" ? quantity : 0;
  const newStock = product.currentStock + qtyNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qtyNumber || qtyNumber <= 0) {
      showError("Please enter a valid quantity greater than 0", "Validation Error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/inventory/stock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product._id,
          quantity: qtyNumber,
          reason: reason.trim(),
          reference: reference.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showError(data.message || "Failed to add stock", "Error");
        return;
      }

      success(
        `Added +${qtyNumber} ${product.unit} to ${product.name}. New Stock: ${newStock} ${product.unit}`,
        "Stock In Recorded"
      );
      setQuantity("");
      setReference("");
      onSuccess();
      onClose();
    } catch {
      showError("Connection error during stock update", "Error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Stock In - Add Inventory"
      description={`Receiving new stock for ${product.name} (SKU: ${product.sku})`}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Stock Math Summary */}
        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs font-sans">
          <div>
            <span className="text-slate-500 block text-[11px]">Current Stock:</span>
            <span className="font-semibold text-slate-900 text-sm">
              {product.currentStock} {product.unit}
            </span>
          </div>
          <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          <div>
            <span className="text-slate-500 block text-[11px]">New Stock Level:</span>
            <span className="font-semibold text-emerald-600 text-sm">
              {newStock} {product.unit}
            </span>
          </div>
        </div>

        {/* Quantity to Add */}
        <Input
          label={`Quantity to Add (${product.unit}) *`}
          type="number"
          min="1"
          required
          placeholder="e.g. 10"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value, 10) || "")}
          leftIcon={<PlusCircle className="w-4 h-4 text-emerald-600" />}
        />

        {/* Reason */}
        <Input
          label="Movement Reason *"
          required
          placeholder="e.g., Supplier Purchase Invoice, Direct Factory Restock"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {/* Reference */}
        <Input
          label="Purchase / PO Reference Number (Optional)"
          placeholder="e.g., PO-2026-9876 or Bill #452"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20" isLoading={isLoading}>
            Confirm Stock In
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
