"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { InvoicePrintSheet } from "@/components/invoice/InvoicePrintSheet";
import { IProduct } from "@/types/product.types";
import { IInvoice, IInvoiceCustomerInfo } from "@/types/invoice.types";
import { calculateInvoice, round2 } from "@/lib/gst/calculator";
import { numberToWordsINR } from "@/lib/utils/numberToWords";
import { formatINR } from "@/lib/utils/formatters";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Printer,
  CheckCircle2,
  Package,
  Car,
  User,
  Phone,
  MapPin,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

interface CartItem {
  product: IProduct;
  quantity: number;
}

const INDIAN_STATES = [
  { name: "Maharashtra", code: "27" },
  { name: "Karnataka", code: "29" },
  { name: "Delhi", code: "07" },
  { name: "Gujarat", code: "24" },
  { name: "Tamil Nadu", code: "33" },
  { name: "Uttar Pradesh", code: "09" },
  { name: "West Bengal", code: "19" },
  { name: "Rajasthan", code: "08" },
  { name: "Telangana", code: "36" },
  { name: "Andhra Pradesh", code: "37" },
  { name: "Madhya Pradesh", code: "23" },
  { name: "Haryana", code: "06" },
  { name: "Punjab", code: "03" },
  { name: "Kerala", code: "32" },
  { name: "Bihar", code: "10" },
  { name: "Odisha", code: "21" },
  { name: "Assam", code: "18" },
  { name: "Goa", code: "30" },
  { name: "Uttarakhand", code: "05" },
  { name: "Jharkhand", code: "20" },
  { name: "Chhattisgarh", code: "22" },
  { name: "Himachal Pradesh", code: "02" },
  { name: "Jammu and Kashmir", code: "01" },
  { name: "Chandigarh", code: "04" },
];

export default function BillingPage() {
  const { success, error: showError } = useToast();

  // Shop Settings State
  const [shopState, setShopState] = useState("Maharashtra");

  // Products catalog search state
  const [products, setProducts] = useState<IProduct[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<IInvoiceCustomerInfo>({
    name: "",
    phone: "",
    vehicleNumber: "",
    address: "",
    notes: "",
  });
  const [placeOfSupply, setPlaceOfSupply] = useState("Maharashtra");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Created invoice state (for preview / print modal)
  const [createdInvoice, setCreatedInvoice] = useState<IInvoice | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Load shop settings to determine home state
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        const json = await res.json();
        if (json.success && json.data) {
          setShopState(json.data.state || "Maharashtra");
          setPlaceOfSupply(json.data.state || "Maharashtra");
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadSettings();
  }, []);

  // Fetch product catalog
  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const params = new URLSearchParams({
        status: "active",
        limit: "50",
      });
      if (search.trim()) params.append("search", search.trim());
      if (selectedCategory !== "all") params.append("category", selectedCategory);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data?.products || []);
      }
    } catch {
      showError("Failed to fetch products for billing", "Error");
    } finally {
      setIsLoadingProducts(false);
    }
  }, [search, selectedCategory, showError]);

  // Fetch categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories?status=active");
        const json = await res.json();
        if (json.success) {
          setCategories(json.data || []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // Check if sale is inter-state
  const isInterState = useMemo(() => {
    return placeOfSupply.toLowerCase().trim() !== shopState.toLowerCase().trim();
  }, [placeOfSupply, shopState]);

  // Add to Cart
  const addToCart = (product: IProduct) => {
    if (product.currentStock <= 0) {
      showError(`"${product.name}" is out of stock.`, "Out of Stock");
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.product._id === product._id);
      if (existingIdx !== -1) {
        const currentQty = prev[existingIdx].quantity;
        if (currentQty >= product.currentStock) {
          showError(
            `Cannot add more. Available stock for "${product.name}" is ${product.currentStock} ${product.unit}.`,
            "Stock Limit Reached"
          );
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Update Cart Quantity
  const updateQuantity = (productId: string, newQty: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product._id === productId) {
            const stockLimit = item.product.currentStock;
            if (newQty > stockLimit) {
              showError(
                `Only ${stockLimit} ${item.product.unit} available in stock for ${item.product.name}.`,
                "Stock Limit Reached"
              );
              return { ...item, quantity: stockLimit };
            }
            return { ...item, quantity: Math.max(1, newQty) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId));
  };

  // Reset Cart
  const clearCart = () => {
    setCart([]);
    setCustomer({
      name: "",
      phone: "",
      vehicleNumber: "",
      address: "",
      notes: "",
    });
  };

  // Calculations Preview
  const liveCalculation = useMemo(() => {
    const lineInputs = cart.map((item) => ({
      productId: item.product._id,
      name: item.product.name,
      sku: item.product.sku,
      hsn: item.product.hsn,
      quantity: item.quantity,
      unit: item.product.unit,
      unitPrice: item.product.sellingPrice,
      gstRate: item.product.gstRate,
    }));

    const result = calculateInvoice(lineInputs, isInterState);
    const words = numberToWordsINR(result.grandTotal);

    return { ...result, amountInWords: words };
  }, [cart, isInterState]);

  // Confirm Invoice
  const handleConfirmInvoice = async () => {
    if (cart.length === 0) {
      showError("Please add at least one spare part to generate bill.", "Cart is Empty");
      return;
    }

    // Client-side stock pre-check
    for (const item of cart) {
      if (item.quantity > item.product.currentStock) {
        showError(
          `Insufficient stock for "${item.product.name}". Available: ${item.product.currentStock}, Requested: ${item.quantity}.`,
          "Stock Validation Error"
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const selectedStateObj = INDIAN_STATES.find((s) => s.name === placeOfSupply);

      const payload = {
        placeOfSupply,
        placeOfSupplyCode: selectedStateObj?.code || "27",
        isInterState,
        customerInfo: customer,
        items: cart.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
          unitPrice: item.product.sellingPrice,
          gstRate: item.product.gstRate,
        })),
      };

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        showError(json.message || "Failed to confirm invoice", "Billing Failed");
        return;
      }

      const invoice: IInvoice = json.data;
      setCreatedInvoice(invoice);
      setIsSuccessModalOpen(true);
      success(`Invoice #${invoice.invoiceNumber} generated successfully!`, "Bill Confirmed");

      // Reset cart and refresh product stock catalog
      clearCart();
      fetchProducts();
    } catch {
      showError("Connection error while creating invoice", "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageContainer
      title="POS Billing Terminal"
      description="Create GST-compliant customer invoices with real-time stock deduction and tax calculations."
      className="max-w-[1600px]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 7 COLS: Product Catalog & Fast Search */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Filter */}
          <Card className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input
                  placeholder="Search parts by Name, SKU, Brand, HSN, Barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-10 bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Product Items Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-sans px-1">
              <span>Spare Parts Available ({products.length})</span>
              <span className="text-[11px]">Click item or "+" to add to invoice</span>
            </div>

            {isLoadingProducts ? (
              <div className="p-12 text-center text-xs text-slate-500 border border-slate-200 rounded-xl bg-white shadow-sm">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Loading spare parts catalog...
              </div>
            ) : products.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-200 rounded-xl bg-white">
                <EmptyState
                  icon={Package}
                  title="No Parts Found"
                  description="No matching spare parts in catalog. Try adjusting search or add new parts in the Catalog tab."
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[640px] overflow-y-auto pr-1">
                {products.map((p) => {
                  const isOutOfStock = p.currentStock <= 0;
                  const isLowStock = p.currentStock > 0 && p.currentStock <= p.minStockLevel;
                  const cartItem = cart.find((c) => c.product._id === p._id);
                  const inCartQty = cartItem?.quantity || 0;

                  return (
                    <div
                      key={p._id}
                      onClick={() => !isOutOfStock && addToCart(p)}
                      className={`p-3.5 rounded-xl border transition-all text-xs font-sans flex flex-col justify-between select-none shadow-sm ${
                        isOutOfStock
                          ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                          : inCartQty > 0
                          ? "bg-blue-50/70 border-blue-400 shadow-md shadow-blue-500/10 cursor-pointer hover:border-blue-600"
                          : "bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 hover:shadow-md cursor-pointer"
                      }`}
                    >
                      <div>
                        {/* Top: SKU & Stock Badge */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-mono text-[11px] font-bold text-slate-600">
                            {p.sku}
                          </span>
                          {isOutOfStock ? (
                            <Badge variant="danger">Out of Stock</Badge>
                          ) : isLowStock ? (
                            <Badge variant="warning">
                              {p.currentStock} {p.unit} left
                            </Badge>
                          ) : (
                            <Badge variant="success">
                              {p.currentStock} {p.unit}
                            </Badge>
                          )}
                        </div>

                        {/* Name */}
                        <h4 className="font-heading font-semibold text-slate-900 text-sm leading-snug line-clamp-2">
                          {p.name}
                        </h4>

                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {p.brand} • {p.category} • HSN: {p.hsn}
                        </p>
                      </div>

                      {/* Pricing & Add Button */}
                      <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Base Price:</span>
                          <span className="font-bold text-slate-900 text-sm font-sans">
                            {formatINR(p.sellingPrice)}
                          </span>
                          <span className="text-[10px] text-blue-600 ml-1 font-mono font-semibold">
                            +{p.gstRate}% GST
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {inCartQty > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-xs shadow-sm">
                              {inCartQty} in cart
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant={isOutOfStock ? "outline" : "primary"}
                            disabled={isOutOfStock}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p);
                            }}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT 5 COLS: Active Invoice Bill Summary & POS Actions */}
        <div className="lg:col-span-5 space-y-4 sticky top-20">
          <Card className="p-4 sm:p-5 border-blue-200 shadow-md">
            {/* Header: Place of Supply & Tax Mode */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h3 className="font-heading font-bold text-slate-900 text-base">New Tax Invoice</h3>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-slate-400 hover:text-rose-600 text-xs flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {/* Customer Information (Optional on Invoice) */}
            <div className="py-3 border-b border-slate-200 space-y-2.5">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-heading">
                Customer & Supply Details
              </p>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Customer Name (Optional)"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  leftIcon={<User className="w-3.5 h-3.5" />}
                />

                <Input
                  placeholder="Mobile No (Optional)"
                  type="tel"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  leftIcon={<Phone className="w-3.5 h-3.5" />}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Vehicle Reg No. (e.g. MH01AB1234)"
                  value={customer.vehicleNumber}
                  onChange={(e) =>
                    setCustomer({ ...customer, vehicleNumber: e.target.value.toUpperCase() })
                  }
                  leftIcon={<Car className="w-3.5 h-3.5" />}
                />

                {/* Place of Supply Dropdown */}
                <div>
                  <select
                    value={placeOfSupply}
                    onChange={(e) => setPlaceOfSupply(e.target.value)}
                    className="w-full h-10 bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-2.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                    title="Place of supply determines GST type"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} value={s.name}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-slate-500">GST Rule:</span>
                <span className="font-bold text-amber-800">
                  {isInterState ? "Inter-State (IGST)" : "Intra-State (CGST + SGST)"}
                </span>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="py-3 border-b border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-sans">
                <span>Selected Items ({cart.length})</span>
                <span>Qty & Taxable</span>
              </div>

              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <ShoppingCart className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                  Cart is empty. Select spare parts from the left to begin bill.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {cart.map((item) => {
                    const itemSubtotal = round2(item.quantity * item.product.sellingPrice);

                    return (
                      <div
                        key={item.product._id}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-slate-900 block truncate">
                            {item.product.name}
                          </span>
                          <span className="text-[11px] text-slate-500 block font-mono">
                            {formatINR(item.product.sellingPrice)} &times; {item.quantity}{" "}
                            {item.product.unit} • {item.product.gstRate}% GST
                          </span>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                            className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:border-blue-400 shadow-sm"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <span className="w-7 text-center font-bold text-slate-900 font-mono">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.currentStock}
                            className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:border-blue-400 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => removeFromCart(item.product._id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors ml-1"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Financial Totals Breakdown */}
            <div className="pt-3 space-y-2 text-xs font-sans">
              <div className="flex justify-between text-slate-500">
                <span>Taxable Subtotal:</span>
                <span className="font-mono text-slate-900 font-semibold">
                  {formatINR(liveCalculation.subtotal)}
                </span>
              </div>

              {!isInterState ? (
                <>
                  <div className="flex justify-between text-slate-500">
                    <span>Central GST (CGST):</span>
                    <span className="font-mono text-slate-700">
                      {formatINR(liveCalculation.totalCgst)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>State GST (SGST):</span>
                    <span className="font-mono text-slate-700">
                      {formatINR(liveCalculation.totalSgst)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-500">
                  <span>Integrated GST (IGST):</span>
                  <span className="font-mono text-slate-700">
                    {formatINR(liveCalculation.totalIgst)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-500">
                <span>Total GST Amount:</span>
                <span className="font-mono text-slate-900 font-semibold">
                  {formatINR(liveCalculation.totalGst)}
                </span>
              </div>

              {liveCalculation.roundOff !== 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Round Off:</span>
                  <span className="font-mono">
                    {liveCalculation.roundOff > 0
                      ? `+${liveCalculation.roundOff}`
                      : liveCalculation.roundOff}
                  </span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-center pt-3 border-t-2 border-blue-500/30">
                <div>
                  <span className="text-xs font-bold text-slate-500 block font-heading uppercase tracking-wider">
                    Grand Total
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">
                    {liveCalculation.amountInWords}
                  </span>
                </div>
                <span className="text-2xl font-bold font-heading text-blue-600 font-mono">
                  {formatINR(liveCalculation.grandTotal)}
                </span>
              </div>

              {/* Confirm & Bill Button */}
              <Button
                variant="gold"
                size="lg"
                className="w-full mt-3 shadow-md"
                disabled={cart.length === 0 || isSubmitting}
                isLoading={isSubmitting}
                onClick={handleConfirmInvoice}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" /> Confirm & Generate Bill
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Invoice Created Success Modal */}
      {createdInvoice && (
        <Dialog
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          title="Invoice Generated Successfully"
          description={`Invoice #${createdInvoice.invoiceNumber} has been confirmed and stock deducted.`}
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <div className="space-y-4">
            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs print:hidden">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {createdInvoice.invoiceNumber}
                </span>
                <Badge variant="success">Confirmed</Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="primary" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-1.5" /> Print Invoice (A4)
                </Button>
                <Link href={`/invoices`}>
                  <Button size="sm" variant="outline">
                    View Invoices List
                  </Button>
                </Link>
              </div>
            </div>

            {/* Printable Sheet Preview */}
            <div className="p-2 border rounded-xl bg-slate-50 border-slate-200">
              <InvoicePrintSheet invoice={createdInvoice} />
            </div>
          </div>
        </Dialog>
      )}
    </PageContainer>
  );
}
