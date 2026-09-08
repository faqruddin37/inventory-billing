import { connectToDatabase } from "@/lib/db/connection";
import { Product, IProductDocument } from "@/models/Product";
import { StockTransaction, IStockTransactionDocument } from "@/models/StockTransaction";
import { StockMovementType, InventorySummary, IStockTransaction } from "@/types/inventory.types";
import mongoose, { FilterQuery } from "mongoose";

export class InventoryService {
  /**
   * Adds stock (STOCK_IN) and logs an immutable ledger transaction
   */
  static async addStock(
    productId: string,
    quantity: number,
    reason: string,
    reference?: string
  ): Promise<{ product: IProductDocument; transaction: IStockTransactionDocument }> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid Product ID.");
    }

    const qtyToAdd = Number(quantity);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      throw new Error("Stock addition quantity must be a positive number.");
    }

    if (!reason || reason.trim().length < 2) {
      throw new Error("Reason is required for stock addition.");
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found.");
    }

    const previousQuantity = product.currentStock;
    const newQuantity = previousQuantity + qtyToAdd;

    // Atomically increment stock
    product.currentStock = newQuantity;
    await product.save();

    // Create ledger transaction
    const transaction = await StockTransaction.create({
      productId: product._id,
      movementType: "STOCK_IN",
      quantity: qtyToAdd,
      previousQuantity,
      newQuantity,
      reason: reason.trim(),
      reference: reference?.trim() || `STOCK-IN-${Date.now()}`,
      createdDate: new Date(),
    });

    return { product, transaction };
  }

  /**
   * Adjusts stock level up or down with mandatory audit reason and records ADJUSTMENT_IN or ADJUSTMENT_OUT
   */
  static async adjustStock(
    productId: string,
    targetQuantity: number,
    reason: string,
    reference?: string
  ): Promise<{ product: IProductDocument; transaction: IStockTransactionDocument }> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid Product ID.");
    }

    const newQuantity = Number(targetQuantity);
    if (isNaN(newQuantity) || newQuantity < 0) {
      throw new Error("Stock quantity cannot be negative.");
    }

    if (!reason || reason.trim().length < 3) {
      throw new Error("A detailed audit reason is required for stock adjustment.");
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found.");
    }

    const previousQuantity = product.currentStock;

    if (newQuantity === previousQuantity) {
      throw new Error(`Target stock (${newQuantity}) is identical to current stock level.`);
    }

    const diff = Math.abs(newQuantity - previousQuantity);
    const movementType: StockMovementType =
      newQuantity > previousQuantity ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT";

    // Update stock
    product.currentStock = newQuantity;
    await product.save();

    // Create ledger transaction
    const transaction = await StockTransaction.create({
      productId: product._id,
      movementType,
      quantity: diff,
      previousQuantity,
      newQuantity,
      reason: reason.trim(),
      reference: reference?.trim() || `ADJUST-${Date.now()}`,
      createdDate: new Date(),
    });

    return { product, transaction };
  }

  /**
   * Retrieves stock history with product details populated
   */
  static async getStockHistory(params: {
    productId?: string;
    movementType?: StockMovementType | "all";
    page?: number;
    limit?: number;
  } = {}): Promise<{
    transactions: IStockTransaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    await connectToDatabase();

    const { productId, movementType = "all", page = 1, limit = 20 } = params;

    const query: FilterQuery<IStockTransactionDocument> = {};

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      query.productId = new mongoose.Types.ObjectId(productId);
    }

    if (movementType && movementType !== "all") {
      query.movementType = movementType;
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [rawTransactions, total] = await Promise.all([
      StockTransaction.find(query)
        .populate("productId", "name sku category unit")
        .sort({ createdDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StockTransaction.countDocuments(query),
    ]);

    const transactions: IStockTransaction[] = rawTransactions.map((t) => {
      const prod = t.productId as unknown as { _id: string; name: string; sku: string } | null;
      return {
        _id: t._id.toString(),
        productId: prod ? prod._id.toString() : t.productId?.toString(),
        productName: prod ? prod.name : "Archived / Deleted Part",
        productSku: prod ? prod.sku : "N/A",
        movementType: t.movementType,
        quantity: t.quantity,
        previousQuantity: t.previousQuantity,
        newQuantity: t.newQuantity,
        reason: t.reason,
        reference: t.reference,
        referenceInvoiceId: t.referenceInvoiceId?.toString(),
        referenceInvoiceNumber: t.referenceInvoiceNumber,
        createdDate: t.createdDate,
      };
    });

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Aggregates real-time inventory statistics & valuation
   */
  static async getInventorySummary(): Promise<InventorySummary> {
    await connectToDatabase();

    const [totalProducts, activeProducts, archivedProducts, valuationResult] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ status: "active" }),
      Product.countDocuments({ status: "archived" }),
      Product.aggregate([
        { $match: { status: "active" } },
        {
          $group: {
            _id: null,
            totalValue: { $sum: { $multiply: ["$currentStock", "$purchasePrice"] } },
            totalUnits: { $sum: "$currentStock" },
            lowStockCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gt: ["$currentStock", 0] },
                      { $lte: ["$currentStock", "$minStockLevel"] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            outOfStockCount: {
              $sum: {
                $cond: [{ $lte: ["$currentStock", 0] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    const stats = valuationResult[0] || {
      totalValue: 0,
      totalUnits: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    };

    return {
      totalProducts,
      activeProducts,
      archivedProducts,
      totalInventoryValue: Math.round((stats.totalValue + Number.EPSILON) * 100) / 100,
      totalUnitsInStock: stats.totalUnits,
      lowStockCount: stats.lowStockCount,
      outOfStockCount: stats.outOfStockCount,
    };
  }
}
