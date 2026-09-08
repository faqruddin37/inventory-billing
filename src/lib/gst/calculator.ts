import { IInvoiceItemSnapshot } from "@/types/invoice.types";

/**
 * High-precision rounding to 2 decimal places using epsilon correction
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export interface LineItemCalculationInput {
  productId: string;
  name: string;
  sku: string;
  hsn: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  gstRate: number;
}

export interface CalculatedInvoiceTotals {
  items: IInvoiceItemSnapshot[];
  subtotal: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  roundOff: number;
  grandTotal: number;
}

/**
 * Computes exact line items and totals for an invoice based on intra/inter-state rules
 */
export function calculateInvoice(
  itemsInput: LineItemCalculationInput[],
  isInterState: boolean
): CalculatedInvoiceTotals {
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const items: IInvoiceItemSnapshot[] = itemsInput.map((item) => {
    const qty = Number(item.quantity);
    const price = Number(item.unitPrice);
    const rate = Number(item.gstRate);

    const taxableAmount = round2(qty * price);
    const gstAmount = round2((taxableAmount * rate) / 100);

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isInterState) {
      igstAmount = gstAmount;
    } else {
      cgstAmount = round2(gstAmount / 2);
      sgstAmount = round2(gstAmount - cgstAmount); // Prevents 1-paisa division drift
    }

    const totalAmount = round2(taxableAmount + gstAmount);

    subtotal = round2(subtotal + taxableAmount);
    totalCgst = round2(totalCgst + cgstAmount);
    totalSgst = round2(totalSgst + sgstAmount);
    totalIgst = round2(totalIgst + igstAmount);

    return {
      productId: item.productId,
      name: item.name,
      sku: item.sku,
      hsn: item.hsn,
      quantity: qty,
      unit: item.unit || "pcs",
      unitPrice: price,
      taxableAmount,
      gstRate: rate,
      gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount,
    };
  });

  const totalGst = round2(totalCgst + totalSgst + totalIgst);
  const rawGrandTotal = round2(subtotal + totalGst);
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = round2(grandTotal - rawGrandTotal);

  return {
    items,
    subtotal,
    totalCgst,
    totalSgst,
    totalIgst,
    totalGst,
    roundOff,
    grandTotal,
  };
}
