import { connectToDatabase } from "@/lib/db/connection";
import { Category, ICategoryDocument } from "@/models/Category";
import { CategoryInput, CategoryUpdateInput } from "@/lib/validations/category.schema";
import mongoose from "mongoose";

export class CategoryService {
  /**
   * Creates a new product category
   */
  static async createCategory(input: CategoryInput): Promise<ICategoryDocument> {
    await connectToDatabase();
    const trimmedName = input.name.trim();

    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });

    if (existing) {
      throw new Error(`Category "${trimmedName}" already exists.`);
    }

    return Category.create({
      name: trimmedName,
      description: input.description?.trim(),
      status: input.status || "active",
    });
  }

  /**
   * Updates an existing category
   */
  static async updateCategory(id: string, input: CategoryUpdateInput): Promise<ICategoryDocument> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid Category ID.");
    }

    const category = await Category.findById(id);
    if (!category) {
      throw new Error("Category not found.");
    }

    if (input.name) {
      const trimmedName = input.name.trim();
      const existing = await Category.findOne({
        name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
        _id: { $ne: id },
      });
      if (existing) {
        throw new Error(`Category "${trimmedName}" already exists.`);
      }
      category.name = trimmedName;
    }

    if (input.description !== undefined) category.description = input.description;
    if (input.status !== undefined) category.status = input.status;

    await category.save();
    return category;
  }

  /**
   * Archives a category (soft delete)
   */
  static async archiveCategory(id: string): Promise<ICategoryDocument> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid Category ID.");
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { status: "archived" },
      { new: true }
    );

    if (!category) {
      throw new Error("Category not found.");
    }

    return category;
  }

  /**
   * Lists all categories
   */
  static async listCategories(status: "all" | "active" | "archived" = "active") {
    await connectToDatabase();
    const query = status === "all" ? {} : { status };
    return Category.find(query).sort({ name: 1 }).lean();
  }
}
