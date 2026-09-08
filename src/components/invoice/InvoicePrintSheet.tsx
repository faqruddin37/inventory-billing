"use client";

import React from "react";
import { IInvoice } from "@/types/invoice.types";
import { formatINR, formatDate } from "@/lib/utils/formatters";
import { Wrench, CreditCard, QrCode } from "lucide-react";

interface InvoicePrintSheetProps {
  invoice: IInvoice;
}

export function InvoicePrintSheet({ invoice }: InvoicePrintSheetProps) {
  const shop = invoice.shopSnapshot;
  const cust = invoice.customerInfo;
  const isInterState = invoice.isInterState;
  const bank = shop.bankDetails;

  const hasBankDetails =
    bank &&
    (bank.bankName ||
      bank.accountNumber ||
      bank.accountName ||
      bank.ifscCode ||
      bank.upiId);

  // Group tax by GST rate for the HSN / Tax summary table
  const taxSummaryMap = new Map<
    number,
    {
      gstRate: number;
      taxableAmount: number;
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      totalTax: number;
    }
  >();

  invoice.items.forEach((item) => {
    const existing = taxSummaryMap.get(item.gstRate) || {
      gstRate: item.gstRate,
      taxableAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalTax: 0,
    };

    existing.taxableAmount += item.taxableAmount;
    existing.cgstAmount += item.cgstAmount;
    existing.sgstAmount += item.sgstAmount;
    existing.igstAmount += item.igstAmount;
    existing.totalTax += item.gstAmount;

    taxSummaryMap.set(item.gstRate, existing);
  });

  const taxSummaries = Array.from(taxSummaryMap.values());

  return (
    <div className="bg-white text-black p-6 sm:p-8 rounded-xl shadow-lg print:shadow-none print:p-0 print:m-0 max-w-4xl mx-auto font-sans text-xs border border-slate-200 print:border-none">
      {/* Cancellation Watermark if Cancelled */}
      {invoice.status === "cancelled" && (
        <div className="bg-red-50 border-2 border-red-500 text-red-700 p-3 rounded-lg mb-4 text-center font-bold text-sm uppercase tracking-widest">
          *** CANCELLED INVOICE *** ({invoice.cancellationReason || "No reason specified"})
        </div>
      )}

      {/* Header: Shop Info & Document Title */}
      <div className="flex justify-between items-start pb-4 border-b-2 border-slate-800">
        <div className="flex gap-3 items-center">
          {shop.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={shop.logoUrl}
              alt={shop.shopName}
              className="w-14 h-14 object-contain rounded-lg border border-slate-200"
            />
          ) : (
            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center text-slate-950 font-bold flex-shrink-0">
              <Wrench className="w-7 h-7" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900 font-heading">
              {shop.shopName}
            </h1>
            <p className="text-slate-600 text-[11px] leading-tight">
              {shop.address}, {shop.city ? `${shop.city}, ` : ""}
              {shop.state} {shop.pincode ? `- ${shop.pincode}` : ""}
            </p>
            <p className="text-slate-600 text-[11px] leading-tight">
              Phone: <span className="font-semibold text-slate-800">{shop.phone}</span> | Email: {shop.email}
            </p>
            <p className="text-slate-800 font-bold text-[11px] mt-0.5">
              GSTIN: <span className="font-mono">{shop.gstin}</span> | State: {shop.state} (Code: {shop.stateCode})
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block bg-slate-900 text-white font-bold px-3 py-1 text-xs uppercase tracking-wider rounded mb-1.5 font-heading">
            Tax Invoice
          </div>
          <p className="text-[10px] text-slate-500 uppercase font-semibold">
            Original for Recipient
          </p>
        </div>
      </div>

      {/* Invoice Meta & Customer Info Grid */}
      <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-300 text-[11px]">
        {/* Left: Invoice Metadata */}
        <div className="space-y-1">
          <div>
            <span className="text-slate-500">Invoice No: </span>
            <span className="font-bold text-slate-900 font-mono text-xs">{invoice.invoiceNumber}</span>
          </div>
          <div>
            <span className="text-slate-500">Invoice Date: </span>
            <span className="font-semibold text-slate-800">{formatDate(invoice.invoiceDate)}</span>
          </div>
          <div>
            <span className="text-slate-500">Place of Supply: </span>
            <span className="font-semibold text-slate-800">
              {invoice.placeOfSupply} {invoice.placeOfSupplyCode ? `(${invoice.placeOfSupplyCode})` : ""}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Tax Type: </span>
            <span className="font-bold text-slate-800">
              {isInterState ? "Inter-State (IGST)" : "Intra-State (CGST + SGST)"}
            </span>
          </div>
        </div>

        {/* Right: Billed To / Vehicle Info */}
        <div className="space-y-1 border-l pl-4 border-slate-200">
          <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-500">
            Bill To / Customer Details:
          </p>
          <div>
            <span className="text-slate-500">Customer Name: </span>
            <span className="font-bold text-slate-900">
              {cust?.name || "Counter Customer"}
            </span>
          </div>
          {cust?.phone && (
            <div>
              <span className="text-slate-500">Mobile No: </span>
              <span className="font-semibold text-slate-800">{cust.phone}</span>
            </div>
          )}
          {cust?.vehicleNumber && (
            <div>
              <span className="text-slate-500">Vehicle Reg. No: </span>
              <span className="font-bold text-slate-900 font-mono">{cust.vehicleNumber}</span>
            </div>
          )}
          {cust?.address && (
            <div>
              <span className="text-slate-500">Address: </span>
              <span className="text-slate-800">{cust.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Itemized Table */}
      <div className="mt-3">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-100 border-y-2 border-slate-800 text-slate-800 font-bold">
              <th className="p-1.5 text-center w-8">#</th>
              <th className="p-1.5 text-left">Description of Spare Parts</th>
              <th className="p-1.5 text-center w-16">HSN</th>
              <th className="p-1.5 text-center w-12">Qty</th>
              <th className="p-1.5 text-right w-20">Unit Rate</th>
              <th className="p-1.5 text-right w-20">Taxable</th>
              <th className="p-1.5 text-center w-12">GST</th>
              {!isInterState ? (
                <>
                  <th className="p-1.5 text-right w-16">CGST</th>
                  <th className="p-1.5 text-right w-16">SGST</th>
                </>
              ) : (
                <th className="p-1.5 text-right w-24">IGST</th>
              )}
              <th className="p-1.5 text-right w-24">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-1.5 text-center font-mono text-slate-500">{idx + 1}</td>
                <td className="p-1.5">
                  <span className="font-bold text-slate-900 block">{item.name}</span>
                  <span className="font-mono text-[10px] text-slate-500">SKU: {item.sku}</span>
                </td>
                <td className="p-1.5 text-center font-mono text-slate-700">{item.hsn}</td>
                <td className="p-1.5 text-center font-bold text-slate-900">
                  {item.quantity} {item.unit}
                </td>
                <td className="p-1.5 text-right font-mono text-slate-800">
                  {formatINR(item.unitPrice).replace("₹", "")}
                </td>
                <td className="p-1.5 text-right font-mono font-semibold text-slate-900">
                  {formatINR(item.taxableAmount).replace("₹", "")}
                </td>
                <td className="p-1.5 text-center font-mono text-slate-700">{item.gstRate}%</td>
                {!isInterState ? (
                  <>
                    <td className="p-1.5 text-right font-mono text-slate-700">
                      {formatINR(item.cgstAmount).replace("₹", "")}
                    </td>
                    <td className="p-1.5 text-right font-mono text-slate-700">
                      {formatINR(item.sgstAmount).replace("₹", "")}
                    </td>
                  </>
                ) : (
                  <td className="p-1.5 text-right font-mono text-slate-700">
                    {formatINR(item.igstAmount).replace("₹", "")}
                  </td>
                )}
                <td className="p-1.5 text-right font-mono font-bold text-slate-900">
                  {formatINR(item.totalAmount).replace("₹", "")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals and GST Summary Grid */}
      <div className="grid grid-cols-12 gap-4 mt-3 pt-2 border-t-2 border-slate-800">
        {/* Left 7 cols: HSN / GST Tax Breakdown Table, Amount in Words & Bank Details */}
        <div className="col-span-7 space-y-2.5">
          {/* Tax Slab Summary Table */}
          <div className="border border-slate-300 rounded overflow-hidden">
            <table className="w-full text-[10px] text-left">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                <tr>
                  <th className="p-1">Rate</th>
                  <th className="p-1 text-right">Taxable</th>
                  {!isInterState ? (
                    <>
                      <th className="p-1 text-right">CGST</th>
                      <th className="p-1 text-right">SGST</th>
                    </>
                  ) : (
                    <th className="p-1 text-right">IGST</th>
                  )}
                  <th className="p-1 text-right">Total Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {taxSummaries.map((ts, i) => (
                  <tr key={i}>
                    <td className="p-1 font-mono font-bold">{ts.gstRate}%</td>
                    <td className="p-1 text-right font-mono">{formatINR(ts.taxableAmount)}</td>
                    {!isInterState ? (
                      <>
                        <td className="p-1 text-right font-mono">{formatINR(ts.cgstAmount)}</td>
                        <td className="p-1 text-right font-mono">{formatINR(ts.sgstAmount)}</td>
                      </>
                    ) : (
                      <td className="p-1 text-right font-mono">{formatINR(ts.igstAmount)}</td>
                    )}
                    <td className="p-1 text-right font-mono font-bold">{formatINR(ts.totalTax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Amount in Words */}
          <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px]">
            <span className="text-slate-500 font-semibold block text-[10px] uppercase">
              Invoice Amount in Words:
            </span>
            <span className="font-bold text-slate-900 font-heading">{invoice.amountInWords}</span>
          </div>

          {/* Optional Bank & UPI Details Box */}
          {hasBankDetails && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[10px] space-y-1">
              <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-600" /> Bank & Payment Details
              </span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-slate-700">
                {bank?.bankName && (
                  <div>
                    <span className="text-slate-500">Bank: </span>
                    <span className="font-semibold">{bank.bankName}</span>
                  </div>
                )}
                {bank?.accountName && (
                  <div>
                    <span className="text-slate-500">A/C Name: </span>
                    <span className="font-semibold">{bank.accountName}</span>
                  </div>
                )}
                {bank?.accountNumber && (
                  <div>
                    <span className="text-slate-500">A/C No: </span>
                    <span className="font-mono font-semibold">{bank.accountNumber}</span>
                  </div>
                )}
                {bank?.ifscCode && (
                  <div>
                    <span className="text-slate-500">IFSC: </span>
                    <span className="font-mono font-semibold">{bank.ifscCode}</span>
                  </div>
                )}
                {bank?.upiId && (
                  <div className="col-span-2 pt-0.5">
                    <span className="text-slate-500">UPI ID: </span>
                    <span className="font-mono font-bold text-amber-700">{bank.upiId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Terms & Conditions */}
          {invoice.termsAndConditions && invoice.termsAndConditions.length > 0 && (
            <div className="text-[10px] text-slate-600">
              <p className="font-bold text-slate-800 uppercase text-[9px]">Terms & Conditions:</p>
              <ul className="list-disc list-inside space-y-0.5 mt-0.5">
                {invoice.termsAndConditions.map((term, i) => (
                  <li key={i}>{term}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right 5 cols: Financial Totals Box & Authorized Signatory */}
        <div className="col-span-5 flex flex-col justify-between">
          <div className="bg-slate-50 border border-slate-300 rounded p-3 text-[11px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-600">Taxable Subtotal:</span>
              <span className="font-mono font-semibold text-slate-800">
                {formatINR(invoice.subtotal)}
              </span>
            </div>

            {!isInterState ? (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Central GST (CGST):</span>
                  <span className="font-mono">{formatINR(invoice.totalCgst)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>State GST (SGST):</span>
                  <span className="font-mono">{formatINR(invoice.totalSgst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-slate-600">
                <span>Integrated GST (IGST):</span>
                <span className="font-mono">{formatINR(invoice.totalIgst)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Total GST Amount:</span>
              <span className="font-mono font-semibold text-slate-800">
                {formatINR(invoice.totalGst)}
              </span>
            </div>

            {invoice.roundOff !== 0 && (
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>Round Off:</span>
                <span className="font-mono">
                  {invoice.roundOff > 0 ? `+${invoice.roundOff}` : invoice.roundOff}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t-2 border-slate-800 text-sm font-bold text-slate-950 font-heading">
              <span>Grand Total:</span>
              <span className="font-mono text-base text-amber-600 font-bold">
                {formatINR(invoice.grandTotal)}
              </span>
            </div>
          </div>

          {/* Signature Box */}
          <div className="pt-6 text-center text-[10px] text-slate-600">
            <div className="border-t border-slate-400 w-40 mx-auto pt-1 font-semibold text-slate-800">
              For {shop.shopName}
            </div>
            <p className="text-[9px] text-slate-500">Authorized Signatory</p>
          </div>
        </div>
      </div>

      {/* Invoice Custom Footer */}
      {shop.invoiceFooter && (
        <div className="mt-4 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 font-medium italic">
          {shop.invoiceFooter}
        </div>
      )}
    </div>
  );
}
