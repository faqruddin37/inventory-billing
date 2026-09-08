"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { IProduct } from "@/types/product.types";
import { Sliders, AlertTriangle } from "lucide-react";

interface StockAdjustDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: IProduct | null;
}

export function StockAdjustDialog({
  isOpen,
  onClose,
  onSuccess,
  product,
}: StockAdjustDialogProps) {
  const { success, error: showError } = useToast();
  const [targetStock, setTargetStock] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setTargetStock(product.currentStock);
      setReason("");
      setReference("");
    }
  }, [product, isOpen]);

  if (!product) return null;

  const targetNum = typeof targetStock === "number" ? targetStock : 0;
  const diff = targetNum - product.currentStock;
  const isIncrease = diff > 0;
  const isDecrease = diff < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (targetNum < 0) {
      showError("Stock cannot be adjusted to a negative value.", "Validation Error");
      return;
    }

    if (diff === 0) {
      showError("New stock level is identical to current stock level.", "Validation Error");
      return;
    }

    if (!reason.trim() || reason.trim().length < 3) {
      showError("Please enter a detailed audit reason for stock adjustment.", "Validation Error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product._id,
          newQuantity: targetNum,
          reason: reason.trim(),
          reference: reference.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showError(data.message || "Failed to adjust stock", "Error");
        return;
      }

      success(
        `Stock adjusted from ${product.currentStock} to ${targetNum} ${product.unit}.`,
        "Stock Adjustment Recorded"
      );
      onSuccess();
      onClose();
    } catch {
      showError("Connection error during stock adjustment", "Error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Audit & Adjustment"
      description={`Adjust physical count for ${product.name} (SKU: ${product.sku})`}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Count Delta Indicator */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-sans">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Current Recorded Stock:</span>
            <span className="font-semibold text-slate-900">
              {product.currentStock} {product.unit}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
            <span className="text-slate-500">Adjustment Difference:</span>
            {diff === 0 ? (
              <span className="text-slate-400">No Change (0)</span>
            ) : isIncrease ? (
              <Badge variant="success">+{diff} {product.unit} (ADJUSTMENT_IN)</Badge>
            ) : (
              <Badge variant="warning">{diff} {product.unit} (ADJUSTMENT_OUT)</Badge>
            )}
          </div>
        </div>

        {/* New Stock Input */}
        <Input
          label={`New Physical Count (${product.unit}) *`}
          type="number"
          min="0"
          required
          value={targetStock}
          onChange={(e) => setTargetStock(parseInt(e.target.value, 10) || 0)}
          leftIcon={<Sliders className="w-4 h-4 text-blue-600" />}
          helperText="Enter the actual counted shelf quantity"
        />

        {/* Mandatory Reason */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700">
            Audit Reason for Adjustment *
          </label>
          <textarea
            required
            rows={2}
            className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
            placeholder="e.g. Physical inventory count correction, Damaged stock write-off, Sample part testing"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {/* Audit Reference */}
        <Input
          label="Audit Reference / Ticket Number (Optional)"
          placeholder="e.g., AUDIT-Q1-2026 or COUNT-04"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />

        {isDecrease && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
            <span>
              This will reduce recorded inventory by {Math.abs(diff)} {product.unit} and record an
              audited reduction transaction.
            </span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20" isLoading={isLoading} disabled={diff === 0}>
            Save Adjustment
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
