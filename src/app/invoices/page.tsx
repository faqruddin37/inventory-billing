"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { InvoicePrintSheet } from "@/components/invoice/InvoicePrintSheet";
import { CancelInvoiceDialog } from "@/components/invoice/CancelInvoiceDialog";
import { IInvoice } from "@/types/invoice.types";
import { formatINR, formatDate, formatDateTime } from "@/lib/utils/formatters";
import {
  FileText,
  Search,
  Printer,
  Eye,
  XCircle,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Car,
  User,
} from "lucide-react";

export default function InvoicesPage() {
  const { error: showError } = useToast();

  // Data states
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "cancelled">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals state
  const [viewingInvoice, setViewingInvoice] = useState<IInvoice | null>(null);
  const [cancellingInvoice, setCancellingInvoice] = useState<IInvoice | null>(null);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        status: statusFilter,
        sortBy: "invoiceDate",
        sortOrder: "desc",
      });

      if (search.trim()) params.append("search", search.trim());

      // Date range filtering
      if (dateFilter === "today") {
        const todayStr = new Date().toISOString().split("T")[0];
        params.append("startDate", todayStr);
        params.append("endDate", todayStr);
      } else if (dateFilter === "week") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        params.append("startDate", d.toISOString().split("T")[0]);
      } else if (dateFilter === "month") {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        params.append("startDate", d.toISOString().split("T")[0]);
      } else if (dateFilter === "custom") {
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
      }

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setInvoices(data.data?.invoices || []);
        setTotal(data.data?.total || 0);
        setTotalPages(data.data?.totalPages || 1);
      }
    } catch {
      showError("Failed to fetch invoices history", "Connection Error");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, dateFilter, startDate, endDate, search, showError]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handlePrintViewingInvoice = () => {
    window.print();
  };

  return (
    <PageContainer
      title="Invoice Management & History"
      description="Search, view, print, download PDF, and manage customer billing records."
      actions={
        <Link href="/billing">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-1.5" /> Create New Bill
          </Button>
        </Link>
      }
    >
      {/* Search & Filter Controls Card */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by Invoice # (e.g. INV-000001), Customer, Vehicle No..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Date Filter Preset */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as typeof dateFilter);
                setPage(1);
              }}
              className="w-full h-10 bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
            >
              <option value="all">All Dates</option>
              <option value="today">Today's Invoices</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter);
                setPage(1);
              }}
              className="w-full h-10 bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
            >
              <option value="all">All Statuses (Confirmed & Cancelled)</option>
              <option value="confirmed">Confirmed Invoices Only</option>
              <option value="cancelled">Cancelled Invoices Only</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {dateFilter === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
        )}
      </Card>

      {/* Invoices List Table */}
      <Card className="p-0 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading invoice records...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={FileText}
              title={search || statusFilter !== "all" ? "No matching invoices" : "No Invoices Generated Yet"}
              description={
                search || statusFilter !== "all"
                  ? "Try resetting your search query or filters above."
                  : "Generate your first customer invoice in the POS Billing Terminal."
              }
              actionLabel={search || statusFilter !== "all" ? "Clear Filters" : "Go to Billing"}
              onAction={() => {
                if (search || statusFilter !== "all") {
                  setSearch("");
                  setStatusFilter("all");
                  setDateFilter("all");
                } else {
                  window.location.assign("/billing");
                }
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Customer / Vehicle</TableHead>
                  <TableHead>Items Sold</TableHead>
                  <TableHead>Place of Supply</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>GST Amount</TableHead>
                  <TableHead>Grand Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const isCancelled = inv.status === "cancelled";

                  return (
                    <TableRow key={inv._id} className={isCancelled ? "opacity-75 bg-rose-50/40" : ""}>
                      {/* Invoice Number */}
                      <TableCell>
                        <span
                          onClick={() => setViewingInvoice(inv)}
                          className="font-mono font-bold text-xs text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {inv.invoiceNumber}
                        </span>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-xs text-slate-600 font-sans whitespace-nowrap">
                        {formatDateTime(inv.invoiceDate)}
                      </TableCell>

                      {/* Customer / Vehicle */}
                      <TableCell className="max-w-xs">
                        <span className="font-semibold text-slate-900 block truncate">
                          {inv.customerInfo?.name || "Counter Sale"}
                        </span>
                        {inv.customerInfo?.vehicleNumber && (
                          <span className="font-mono text-[11px] text-amber-800 block font-medium">
                            🚗 {inv.customerInfo.vehicleNumber}
                          </span>
                        )}
                        {inv.customerInfo?.phone && (
                          <span className="text-[10px] text-slate-500 block font-sans">
                            {inv.customerInfo.phone}
                          </span>
                        )}
                      </TableCell>

                      {/* Items Sold */}
                      <TableCell>
                        <span className="text-xs text-slate-700">
                          {inv.items.length} {inv.items.length === 1 ? "part" : "parts"}
                        </span>
                      </TableCell>

                      {/* Place of Supply */}
                      <TableCell className="text-xs text-slate-600">
                        {inv.placeOfSupply}
                        <span className="block text-[10px] text-slate-500">
                          {inv.isInterState ? "IGST" : "CGST+SGST"}
                        </span>
                      </TableCell>

                      {/* Taxable Subtotal */}
                      <TableCell className="text-xs font-mono text-slate-700">
                        {formatINR(inv.subtotal)}
                      </TableCell>

                      {/* Total GST */}
                      <TableCell className="text-xs font-mono text-slate-500">
                        {formatINR(inv.totalGst)}
                      </TableCell>

                      {/* Grand Total */}
                      <TableCell className="text-xs font-mono font-bold text-slate-900">
                        {formatINR(inv.grandTotal)}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {isCancelled ? (
                          <Badge variant="danger">Cancelled</Badge>
                        ) : (
                          <Badge variant="success">Confirmed</Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View */}
                          <button
                            onClick={() => setViewingInvoice(inv)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                            title="View Invoice Sheet"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Print */}
                          <button
                            onClick={() => {
                              setViewingInvoice(inv);
                              setTimeout(() => window.print(), 300);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 transition-colors"
                            title="Print Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Cancel Invoice */}
                          {!isCancelled && (
                            <button
                              onClick={() => setCancellingInvoice(inv)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                              title="Cancel Invoice & Restore Stock"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-sans">
            <div>
              Showing page <span className="text-slate-900 font-semibold">{page}</span> of{" "}
              <span className="text-slate-900 font-semibold">{totalPages}</span> ({total} total invoices)
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

      {/* View & Print Modal Dialog */}
      {viewingInvoice && (
        <Dialog
          isOpen={!!viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          title={`Invoice #${viewingInvoice.invoiceNumber}`}
          description={`Issued on ${formatDate(viewingInvoice.invoiceDate)} • Status: ${viewingInvoice.status}`}
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <div className="space-y-4">
            {/* Modal Actions Bar */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs print:hidden">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {viewingInvoice.invoiceNumber}
                </span>
                <Badge variant={viewingInvoice.status === "confirmed" ? "success" : "danger"}>
                  {viewingInvoice.status === "confirmed" ? "Confirmed" : "Cancelled"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="primary" onClick={handlePrintViewingInvoice}>
                  <Printer className="w-4 h-4 mr-1.5" /> Print A4 Invoice
                </Button>
                {viewingInvoice.status === "confirmed" && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setCancellingInvoice(viewingInvoice);
                      setViewingInvoice(null);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-1.5" /> Cancel Invoice
                  </Button>
                )}
              </div>
            </div>

            {/* Printable Sheet */}
            <div className="p-2 border rounded-xl bg-slate-100 border-slate-200">
              <InvoicePrintSheet invoice={viewingInvoice} />
            </div>
          </div>
        </Dialog>
      )}

      {/* Cancel Invoice Modal */}
      <CancelInvoiceDialog
        isOpen={!!cancellingInvoice}
        onClose={() => setCancellingInvoice(null)}
        onSuccess={fetchInvoices}
        invoice={cancellingInvoice}
      />
    </PageContainer>
  );
}
