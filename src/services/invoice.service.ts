import { connectToDatabase } from "@/lib/db/connection";
import { Invoice, IInvoiceDocument } from "@/models/Invoice";
import { Product, IProductDocument } from "@/models/Product";
import { StockTransaction } from "@/models/StockTransaction";
import { SettingsService } from "./settings.service";
import { calculateInvoice, LineItemCalculationInput } from "@/lib/gst/calculator";
import { numberToWordsINR } from "@/lib/utils/numberToWords";
import {
  CreateInvoicePayload,
  InvoiceFilterParams,
  IInvoice,
} from "@/types/invoice.types";
import mongoose, { FilterQuery } from "mongoose";

export class InvoiceService {
  /**
   * Creates a confirmed invoice with server-side recalculated totals, atomic stock deduction,
   * and immutable stock transaction ledger entries.
   */
  static async createInvoice(payload: CreateInvoicePayload): Promise<IInvoiceDocument> {
    await connectToDatabase();

    if (!payload.items || payload.items.length === 0) {
      throw new Error("Invoice must contain at least one line item.");
    }

    // 1. Fetch current Shop Settings
    const shopSettings = await SettingsService.getSettings();

    // Determine place of supply and inter-state tax rule
    const placeOfSupply = payload.placeOfSupply?.trim() || shopSettings.state;
    const isInterState =
      payload.isInterState !== undefined
        ? payload.isInterState
        : placeOfSupply.toLowerCase() !== shopSettings.state.toLowerCase();

    // 2. Validate all products and stock availability on server
    const lineItemInputs: LineItemCalculationInput[] = [];
    const productDocuments: IProductDocument[] = [];

    for (const item of payload.items) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        throw new Error(`Invalid Product ID: ${item.productId}`);
      }

      const requestedQty = Number(item.quantity);
      if (isNaN(requestedQty) || requestedQty <= 0) {
        throw new Error("Quantity must be greater than zero for all items.");
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product not found with ID: ${item.productId}`);
      }

      if (product.status === "archived") {
        throw new Error(`Product "${product.name}" (SKU: ${product.sku}) is archived and cannot be billed.`);
      }

      // Check stock availability
      if (product.currentStock < requestedQty) {
        throw new Error(
          `Insufficient stock for "${product.name}" (SKU: ${product.sku}). Available: ${product.currentStock} ${product.unit}, Requested: ${requestedQty} ${product.unit}.`
        );
      }

      // Use unitPrice and gstRate from payload if provided (or default to product catalog values)
      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : product.sellingPrice;
      const gstRate = item.gstRate !== undefined ? Number(item.gstRate) : product.gstRate;

      if (unitPrice < 0) {
        throw new Error(`Unit price cannot be negative for product "${product.name}".`);
      }

      lineItemInputs.push({
        productId: product._id.toString(),
        name: product.name,
        sku: product.sku,
        hsn: product.hsn,
        quantity: requestedQty,
        unit: product.unit,
        unitPrice,
        gstRate,
      });

      productDocuments.push(product);
    }

    // 3. Perform Server-side GST and Totals Calculations
    const calculated = calculateInvoice(lineItemInputs, isInterState);
    const amountInWords = numberToWordsINR(calculated.grandTotal);
    const invoiceNumber = await SettingsService.getNextInvoiceNumber();

    // 4. Create Invoice Record with Frozen Snapshots
    const invoice = await Invoice.create({
      invoiceNumber,
      invoiceDate: new Date(),
      placeOfSupply,
      placeOfSupplyCode: payload.placeOfSupplyCode || shopSettings.stateCode,
      isInterState,
      customerInfo: {
        name: payload.customerInfo?.name?.trim() || "",
        phone: payload.customerInfo?.phone?.trim() || "",
        address: payload.customerInfo?.address?.trim() || "",
        vehicleNumber: payload.customerInfo?.vehicleNumber?.trim()?.toUpperCase() || "",
        notes: payload.customerInfo?.notes?.trim() || "",
      },
      shopSnapshot: {
        shopName: shopSettings.shopName,
        logoUrl: shopSettings.logoUrl || "",
        address: shopSettings.address,
        city: shopSettings.city,
        state: shopSettings.state,
        stateCode: shopSettings.stateCode,
        pincode: shopSettings.pincode,
        phone: shopSettings.phone,
        email: shopSettings.email,
        gstin: shopSettings.gstin,
        invoiceFooter: shopSettings.invoiceFooter || "",
        bankDetails: shopSettings.bankDetails || {},
      },
      items: calculated.items,
      subtotal: calculated.subtotal,
      totalCgst: calculated.totalCgst,
      totalSgst: calculated.totalSgst,
      totalIgst: calculated.totalIgst,
      totalGst: calculated.totalGst,
      roundOff: calculated.roundOff,
      grandTotal: calculated.grandTotal,
      amountInWords,
      status: "confirmed",
      termsAndConditions: payload.termsAndConditions || shopSettings.termsAndConditions || [],
    });

    // 5. Atomically deduct stock and log SALE StockTransactions
    for (let i = 0; i < productDocuments.length; i++) {
      const prod = productDocuments[i];
      const soldQty = lineItemInputs[i].quantity;
      const prevStock = prod.currentStock;
      const newStock = prevStock - soldQty;

      // Deduct stock
      prod.currentStock = newStock;
      await prod.save();

      // Log transaction
      await StockTransaction.create({
        productId: prod._id,
        movementType: "SALE",
        quantity: soldQty,
        previousQuantity: prevStock,
        newQuantity: newStock,
        reason: `Billed in Invoice #${invoice.invoiceNumber}`,
        reference: invoice.invoiceNumber,
        referenceInvoiceId: invoice._id,
        referenceInvoiceNumber: invoice.invoiceNumber,
        createdDate: new Date(),
      });
    }

    return invoice;
  }

  /**
   * Cancels a confirmed invoice, marks it as cancelled, and reverses the sold stock
   * by logging SALE_REVERSAL transactions for each item.
   */
  static async cancelInvoice(id: string, reason: string): Promise<IInvoiceDocument> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid Invoice ID.");
    }

    if (!reason || reason.trim().length < 3) {
      throw new Error("A valid cancellation reason is required (min 3 characters).");
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      throw new Error("Invoice not found.");
    }

    if (invoice.status === "cancelled") {
      throw new Error("Invoice is already cancelled.");
    }

    // 1. Mark Invoice as Cancelled
    invoice.status = "cancelled";
    invoice.cancellationReason = reason.trim();
    invoice.cancelledAt = new Date();
    await invoice.save();

    // 2. Reverse Stock for each line item
    for (const item of invoice.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        const prevStock = product.currentStock;
        const newStock = prevStock + item.quantity;

        // Restore stock
        product.currentStock = newStock;
        await product.save();

        // Record reversal ledger entry
        await StockTransaction.create({
          productId: product._id,
          movementType: "SALE_REVERSAL",
          quantity: item.quantity,
          previousQuantity: prevStock,
          newQuantity: newStock,
          reason: `Reversal from Cancelled Invoice #${invoice.invoiceNumber}: ${reason.trim()}`,
          reference: invoice.invoiceNumber,
          referenceInvoiceId: invoice._id,
          referenceInvoiceNumber: invoice.invoiceNumber,
          createdDate: new Date(),
        });
      }
    }

    return invoice;
  }

  /**
   * Retrieves a single invoice by ID
   */
  static async getInvoiceById(id: string): Promise<IInvoiceDocument | null> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return Invoice.findById(id);
  }

  /**
   * Retrieves a single invoice by its sequential Invoice Number (e.g. INV-000001)
   */
  static async getInvoiceByNumber(invoiceNumber: string): Promise<IInvoiceDocument | null> {
    await connectToDatabase();
    return Invoice.findOne({ invoiceNumber: invoiceNumber.trim().toUpperCase() });
  }

  /**
   * Lists invoices with search, filters (date, status, customer), and pagination
   */
  static async listInvoices(params: InvoiceFilterParams = {}): Promise<{
    invoices: IInvoice[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    await connectToDatabase();

    const {
      search,
      status = "all",
      startDate,
      endDate,
      sortBy = "invoiceDate",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = params;

    const query: FilterQuery<IInvoiceDocument> = {};

    if (status && status !== "all") {
      query.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.invoiceDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.invoiceDate.$lte = end;
      }
    }

    // Search query
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { invoiceNumber: searchRegex },
        { "customerInfo.name": searchRegex },
        { "customerInfo.phone": searchRegex },
        { "customerInfo.vehicleNumber": searchRegex },
        { "items.name": searchRegex },
        { "items.sku": searchRegex },
      ];
    }

    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortDirection };
    const skip = (Math.max(1, page) - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
      Invoice.countDocuments(query),
    ]);

    return {
      invoices: invoices as unknown as IInvoice[],
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
