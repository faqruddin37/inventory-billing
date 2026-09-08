"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { IInvoice } from "@/types/invoice.types";
import { AlertTriangle } from "lucide-react";

interface CancelInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoice: IInvoice | null;
}

export function CancelInvoiceDialog({
  isOpen,
  onClose,
  onSuccess,
  invoice,
}: CancelInvoiceDialogProps) {
  const { success, error: showError } = useToast();
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!invoice) return null;

  const handleCancelInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 3) {
      showError("Please provide a valid cancellation reason (min 3 characters).", "Validation Error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoice._id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancellationReason: reason.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showError(data.message || "Failed to cancel invoice", "Cancellation Failed");
        return;
      }

      success(
        `Invoice #${invoice.invoiceNumber} has been cancelled and stock returned to inventory.`,
        "Invoice Cancelled"
      );
      setReason("");
      onSuccess();
      onClose();
    } catch {
      showError("Connection error while cancelling invoice", "Error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Cancel Invoice #${invoice.invoiceNumber}`}
      description="Cancelling will mark the invoice as cancelled and automatically reverse the sold items back into active stock."
      className="max-w-md"
    >
      <form onSubmit={handleCancelInvoice} className="space-y-4 pt-2">
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5 font-sans">
          <div className="flex items-center gap-1.5 font-semibold text-rose-700">
            <AlertTriangle className="w-4 h-4" /> Stock Reversal Warning
          </div>
          <p>
            {invoice.items.length} product(s) with total grand amount of{" "}
            <span className="font-bold text-slate-900">₹{invoice.grandTotal.toLocaleString("en-IN")}</span>{" "}
            will have their inventory counts restored via SALE_REVERSAL transactions.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Mandatory Cancellation Reason *
          </label>
          <textarea
            required
            rows={2}
            className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg p-3 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 shadow-sm"
            placeholder="e.g., Customer returned parts before delivery, Duplicate bill entry, Billing error"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Keep Invoice
          </Button>
          <Button type="submit" variant="danger" isLoading={isLoading}>
            Confirm Cancellation
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
