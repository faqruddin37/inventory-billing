"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { InvoicePrintSheet } from "@/components/invoice/InvoicePrintSheet";
import { CancelInvoiceDialog } from "@/components/invoice/CancelInvoiceDialog";
import { IInvoice } from "@/types/invoice.types";
import { Printer, ArrowLeft, XCircle, FileText } from "lucide-react";

interface InvoiceViewPageProps {
  params: Promise<{ id: string }>;
}

export default function InvoiceViewPage({ params }: InvoiceViewPageProps) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<IInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const fetchInvoice = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setInvoice(data.data);
      } else {
        setError(data.message || "Invoice not found");
      }
    } catch {
      setError("Failed to load invoice");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <PageContainer title="Loading Invoice...">
        <div className="p-16 text-center text-xs text-slate-400">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Fetching invoice details...
        </div>
      </PageContainer>
    );
  }

  if (error || !invoice) {
    return (
      <PageContainer title="Invoice Not Found">
        <Card className="p-8 text-center space-y-4">
          <p className="text-sm text-status-danger">{error || "Invoice does not exist"}</p>
          <Link href="/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Invoices
            </Button>
          </Link>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Tax Invoice #${invoice.invoiceNumber}`}
      description={`Status: ${invoice.status.toUpperCase()} • Generated on ${new Date(
        invoice.invoiceDate
      ).toLocaleDateString("en-IN")}`}
      actions={
        <div className="flex items-center gap-2.5 print:hidden">
          <Link href="/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>

          <Button variant="primary" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" /> Print / Save PDF
          </Button>

          {invoice.status === "confirmed" && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsCancelModalOpen(true)}
            >
              <XCircle className="w-4 h-4 mr-1.5" /> Cancel Invoice
            </Button>
          )}
        </div>
      }
    >
      <div className="p-2 sm:p-4 rounded-xl bg-slate-100 border border-slate-200 shadow-sm">
        <InvoicePrintSheet invoice={invoice} />
      </div>

      <CancelInvoiceDialog
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onSuccess={fetchInvoice}
        invoice={invoice}
      />
    </PageContainer>
  );
}
