import { connectToDatabase } from "@/lib/db/connection";
import { Product, IProductDocument } from "@/models/Product";
import { StockTransaction } from "@/models/StockTransaction";
import { ProductFilterParams, IProduct, GSTPercentage } from "@/types/product.types";
import { ProductInput, ProductUpdateInput } from "@/lib/validations/product.schema";
import mongoose, { FilterQuery } from "mongoose";

export class ProductService {
  /**
   * Creates a new product and records initial stock transaction if initial stock > 0
   */
  static async createProduct(input: ProductInput): Promise<IProductDocument> {
    await connectToDatabase();

    const formattedSku = input.sku.trim().toUpperCase();

    // Check for duplicate SKU
    const existing = await Product.findOne({ sku: formattedSku });
    if (existing) {
      throw new Error(`Product with SKU "${formattedSku}" already exists.`);
    }

    const initialStock = Number(input.currentStock) || 0;
    if (initialStock < 0) {
      throw new Error("Initial stock cannot be negative.");
    }

    const product = await Product.create({
      ...input,
      sku: formattedSku,
      currentStock: initialStock,
    });

    // Record initial stock transaction if stock > 0
    if (initialStock > 0) {
      await StockTransaction.create({
        productId: product._id,
        movementType: "STOCK_IN",
        quantity: initialStock,
        previousQuantity: 0,
        newQuantity: initialStock,
        reason: "Initial Inventory Entry on Product Creation",
        reference: `PROD-INIT-${product.sku}`,
        createdDate: new Date(),
      });
    }

    return product;
  }

  /**
   * Updates an existing product without allowing direct stock mutation
   */
  static async updateProduct(id: string, input: ProductUpdateInput): Promise<IProductDocument> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid Product ID.");
    }

    const product = await Product.findById(id);
    if (!product) {
      throw new Error("Product not found.");
    }

    if (input.sku) {
      const formattedSku = input.sku.trim().toUpperCase();
      if (formattedSku !== product.sku) {
        const existing = await Product.findOne({ sku: formattedSku, _id: { $ne: id } });
        if (existing) {
          throw new Error(`Product with SKU "${formattedSku}" already exists.`);
        }
        product.sku = formattedSku;
      }
    }

    if (input.name !== undefined) product.name = input.name;
    if (input.category !== undefined) product.category = input.category;
    if (input.brand !== undefined) product.brand = input.brand;
    if (input.hsn !== undefined) product.hsn = input.hsn;
    if (input.purchasePrice !== undefined) product.purchasePrice = Number(input.purchasePrice);
    if (input.sellingPrice !== undefined) product.sellingPrice = Number(input.sellingPrice);
    if (input.gstRate !== undefined) product.gstRate = input.gstRate as GSTPercentage;
    if (input.minStockLevel !== undefined) product.minStockLevel = Number(input.minStockLevel);
    if (input.unit !== undefined) product.unit = input.unit;
    if (input.barcode !== undefined) product.barcode = input.barcode;
    if (input.status !== undefined) product.status = input.status;

    await product.save();
    return product;
  }

  /**
   * Archives a product (soft delete) to preserve historical data
   */
  static async archiveProduct(id: string): Promise<IProductDocument> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid Product ID.");
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { status: "archived" },
      { new: true }
    );

    if (!product) {
      throw new Error("Product not found.");
    }

    return product;
  }

  /**
   * Activates an archived or inactive product
   */
  static async activateProduct(id: string): Promise<IProductDocument> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid Product ID.");
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { status: "active" },
      { new: true }
    );

    if (!product) {
      throw new Error("Product not found.");
    }

    return product;
  }

  /**
   * Gets a single product by ID
   */
  static async getProductById(id: string): Promise<IProductDocument | null> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return Product.findById(id);
  }

  /**
   * Lists products with filtering, search, sorting and pagination
   */
  static async listProducts(params: ProductFilterParams = {}): Promise<{
    products: IProduct[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    await connectToDatabase();

    const {
      search,
      category,
      brand,
      status = "all",
      stockStatus = "all",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = params;

    const query: FilterQuery<IProductDocument> = {};

    // Status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Brand filter
    if (brand && brand !== "all") {
      query.brand = brand;
    }

    // Search query across name, sku, brand, category, barcode
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { sku: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { barcode: searchRegex },
        { hsn: searchRegex },
      ];
    }

    // Stock status filters
    if (stockStatus === "out_of_stock") {
      query.currentStock = { $lte: 0 };
    } else if (stockStatus === "low_stock") {
      query.$expr = {
        $and: [
          { $gt: ["$currentStock", 0] },
          { $lte: ["$currentStock", "$minStockLevel"] },
        ],
      };
    } else if (stockStatus === "in_stock") {
      query.$expr = {
        $gt: ["$currentStock", "$minStockLevel"],
      };
    }

    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortDirection };

    const skip = (Math.max(1, page) - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    return {
      products: products as unknown as IProduct[],
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves unique distinct brands
   */
  static async getDistinctBrands(): Promise<string[]> {
    await connectToDatabase();
    return Product.distinct("brand", { status: { $ne: "archived" } });
  }

  /**
   * Retrieves unique distinct categories
   */
  static async getDistinctCategories(): Promise<string[]> {
    await connectToDatabase();
    return Product.distinct("category", { status: { $ne: "archived" } });
  }
}
