"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { IShopSettings } from "@/types/settings.types";
import {
  Building2,
  FileText,
  CreditCard,
  Save,
  Wrench,
  RefreshCw,
  Sparkles,
  Hash,
  MessageSquare,
} from "lucide-react";

export default function SettingsPage() {
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<IShopSettings>({
    shopName: "",
    logoUrl: "",
    address: "",
    city: "",
    state: "Maharashtra",
    stateCode: "27",
    pincode: "",
    phone: "",
    email: "",
    gstin: "",
    invoicePrefix: "INV-",
    startingInvoiceNumber: 1,
    termsAndConditions: [],
    invoiceFooter: "Thank you for your business! Drive safely.",
    bankDetails: {
      accountName: "",
      accountNumber: "",
      bankName: "",
      ifscCode: "",
      upiId: "",
    },
  });

  const [termsText, setTermsText] = useState("");

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success && json.data) {
        setFormData(json.data);
        setTermsText((json.data.termsAndConditions || []).join("\n"));
      }
    } catch {
      showError("Failed to fetch shop settings", "Error");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Live preview of the next formatted invoice number
  const nextInvoicePreview = `${formData.invoicePrefix || "INV-"}${String(
    formData.startingInvoiceNumber || 1
  ).padStart(6, "0")}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const termsArray = termsText
        .split("\n")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload = {
        ...formData,
        termsAndConditions: termsArray,
      };

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showError(data.message || "Failed to update settings", "Save Failed");
        return;
      }

      success("Shop details and invoice configuration updated successfully.", "Settings Saved");
      fetchSettings();
    } catch {
      showError("Connection error while updating settings", "Error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Shop Settings & Configuration">
        <div className="p-16 text-center text-xs text-slate-400">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading workshop configuration...
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Workshop & GST Configuration"
      description="Manage shop profile, GSTIN, invoice prefix sequence, state tax rules, and invoice terms."
      actions={
        <Button variant="secondary" size="md" onClick={fetchSettings} disabled={isLoading || isSaving}>
          <RefreshCw className="w-4 h-4 mr-1.5 text-primary" /> Reload
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* SECTION 1: Shop Information & GSTIN */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Shop Profile & GST Identification
            </CardTitle>
            <CardDescription>
              This information is printed at the top of every generated Tax Invoice.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Automobile Shop Name *"
                  placeholder="e.g., Apex Auto Spares & Garage"
                  required
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                />
              </div>

              <div>
                <Input
                  label="Shop GSTIN (15 Characters) *"
                  placeholder="27ABCDE1234F1Z5"
                  required
                  value={formData.gstin}
                  onChange={(e) =>
                    setFormData({ ...formData, gstin: e.target.value.toUpperCase() })
                  }
                  helperText="State code prefix must match State Code"
                />
              </div>

              <div>
                <Input
                  label="Shop Phone Number *"
                  placeholder="+91 98765 43210"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <Input
                  label="Shop Email Address *"
                  type="email"
                  placeholder="contact@apexautospares.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <Input
                  label="Logo URL (Optional)"
                  placeholder="https://example.com/logo.png"
                  value={formData.logoUrl || ""}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  helperText="Direct image URL for invoice header"
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Street Address *"
                  placeholder="Shop No. 4, Motor Market, Main Road"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div>
                <Input
                  label="City *"
                  placeholder="Mumbai"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div>
                <Input
                  label="Home State (for Intra-State GST) *"
                  placeholder="Maharashtra"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  helperText="Sales to this state use CGST+SGST"
                />
              </div>

              <div>
                <Input
                  label="State Code (2 Digits) *"
                  placeholder="27"
                  required
                  value={formData.stateCode}
                  onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                />
              </div>

              <div>
                <Input
                  label="Pincode *"
                  placeholder="400001"
                  required
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Invoice Numbering & Sequence */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Invoice Sequence & Numbering
            </CardTitle>
            <CardDescription>
              Configure the sequential format and terms for invoices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Live Sequence Preview Card */}
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Hash className="w-4 h-4 text-blue-600" />
                <span className="text-slate-700 font-medium">Next Invoice Format Preview:</span>
              </div>
              <span className="font-mono font-bold text-blue-600 text-sm tracking-wider">
                {nextInvoicePreview}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Invoice Prefix *"
                  placeholder="INV- or INV-26-"
                  required
                  value={formData.invoicePrefix}
                  onChange={(e) =>
                    setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })
                  }
                  helperText="Will prefix every sequential invoice"
                />
              </div>

              <div>
                <Input
                  label="Starting Sequence Number *"
                  type="number"
                  min="1"
                  required
                  value={formData.startingInvoiceNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      startingInvoiceNumber: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  helperText="Unique sequence number starting index"
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Invoice Footer Note (Optional)"
                  placeholder="Thank you for your business! Drive safely."
                  value={formData.invoiceFooter || ""}
                  onChange={(e) => setFormData({ ...formData, invoiceFooter: e.target.value })}
                  helperText="Printed at the bottom center of invoices"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1.5 font-sans">
                  Invoice Terms & Conditions (One per line)
                </label>
                <textarea
                  rows={4}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-3 font-sans focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                  placeholder="Enter invoice terms and conditions..."
                  value={termsText}
                  onChange={(e) => setTermsText(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: Bank & UPI Payment Display Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Bank & UPI Information (For Invoice Display)
            </CardTitle>
            <CardDescription>
              Printed on the invoice so customers can wire transfer or pay via UPI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Account Holder Name"
                  placeholder="Apex Auto Spares"
                  value={formData.bankDetails?.accountName || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, accountName: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <Input
                  label="Bank Name"
                  placeholder="HDFC Bank"
                  value={formData.bankDetails?.bankName || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, bankName: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <Input
                  label="Bank Account Number"
                  placeholder="987654321000"
                  value={formData.bankDetails?.accountNumber || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, accountNumber: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <Input
                  label="IFSC Code"
                  placeholder="HDFC0001234"
                  value={formData.bankDetails?.ifscCode || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: {
                        ...formData.bankDetails,
                        ifscCode: e.target.value.toUpperCase(),
                      },
                    })
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="UPI ID"
                  placeholder="apexauto@okhdfcbank"
                  value={formData.bankDetails?.upiId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, upiId: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="lg" isLoading={isSaving}>
            <Save className="w-5 h-5 mr-2" /> Save Shop Settings
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
