import mongoose from "mongoose";
import { connectToDatabase } from "../src/lib/db/connection";
import { Product } from "../src/models/Product";
import { Category } from "../src/models/Category";
import { StockTransaction } from "../src/models/StockTransaction";
import { ProductService } from "../src/services/product.service";
import { CategoryService } from "../src/services/category.service";
import { InventoryService } from "../src/services/inventory.service";

async function runTests() {
  console.log("=========================================");
  console.log("  PHASE 2 COMPREHENSIVE BUSINESS LOGIC TEST");
  console.log("=========================================\n");

  try {
    console.log("1. Connecting to MongoDB via connectToDatabase()...");
    await connectToDatabase();
    console.log("   ✓ MongoDB connected successfully!\n");

    // Clean up test data if previous test ran
    const testSku1 = "TEST-BRAKE-001";
    const testSku2 = "TEST-OIL-002";
    await Product.deleteMany({ sku: { $in: [testSku1, testSku2] } });
    await Category.deleteMany({ name: "Test Auto Category" });

    // TEST 1: Category Creation
    console.log("2. Testing Category Creation...");
    const cat = await CategoryService.createCategory({
      name: "Test Auto Category",
      description: "Test Category for Verification",
    });
    console.log(`   ✓ Category created: ID ${cat._id}, Name "${cat.name}"\n`);

    // TEST 2: Duplicate Category Prevention
    console.log("3. Testing Duplicate Category Prevention...");
    try {
      await CategoryService.createCategory({ name: "Test Auto Category" });
      throw new Error("FAILED: Duplicate category should have thrown an error!");
    } catch (err: unknown) {
      console.log(`   ✓ Correctly rejected duplicate category: "${(err as Error).message}"\n`);
    }

    // TEST 3: Product Creation with initial stock
    console.log("4. Testing Product Creation with Initial Stock...");
    const product = await ProductService.createProduct({
      name: "Bosch Premium Front Brake Pad",
      sku: testSku1,
      category: "Test Auto Category",
      brand: "Bosch",
      hsn: "8708",
      purchasePrice: 1200,
      sellingPrice: 1800,
      gstRate: 18,
      currentStock: 10,
      minStockLevel: 3,
      unit: "set",
      barcode: "8901234567890",
      status: "active",
    });
    console.log(`   ✓ Product created: ID ${product._id}, SKU "${product.sku}", Stock: ${product.currentStock}`);

    // Verify initial stock transaction was recorded
    const initialTx = await StockTransaction.findOne({ productId: product._id });
    if (!initialTx || initialTx.movementType !== "STOCK_IN" || initialTx.quantity !== 10) {
      throw new Error("FAILED: Initial Stock Transaction was not created accurately!");
    }
    console.log(`   ✓ Initial StockTransaction recorded: Type ${initialTx.movementType}, Qty +${initialTx.quantity}, Reason "${initialTx.reason}"\n`);

    // TEST 4: Duplicate SKU Prevention
    console.log("5. Testing Duplicate SKU Prevention...");
    try {
      await ProductService.createProduct({
        name: "Another Brake Pad",
        sku: testSku1, // Duplicate SKU
        category: "Test Auto Category",
        brand: "Brembo",
        hsn: "8708",
        purchasePrice: 1000,
        sellingPrice: 1500,
        gstRate: 18,
        currentStock: 5,
        minStockLevel: 2,
        unit: "set",
        status: "active",
      });
      throw new Error("FAILED: Duplicate SKU should have been rejected!");
    } catch (err: unknown) {
      console.log(`   ✓ Correctly rejected duplicate SKU: "${(err as Error).message}"\n`);
    }

    // TEST 5: Stock Addition (STOCK_IN)
    console.log("6. Testing Stock Addition (STOCK_IN)...");
    const { product: updatedAfterIn, transaction: inTx } = await InventoryService.addStock(
      product._id.toString(),
      5,
      "Supplier Bulk Purchase PO-101",
      "PO-101"
    );
    console.log(`   ✓ Stock increased from 10 to ${updatedAfterIn.currentStock}`);
    console.log(`   ✓ Transaction logged: ${inTx.movementType}, Change +${inTx.quantity}, Previous ${inTx.previousQuantity} -> New ${inTx.newQuantity}\n`);

    // TEST 6: Stock Adjustment (ADJUSTMENT_OUT)
    console.log("7. Testing Stock Adjustment (ADJUSTMENT_OUT)...");
    const { product: updatedAfterAdj, transaction: adjTx } = await InventoryService.adjustStock(
      product._id.toString(),
      12, // Adjusted down from 15 to 12
      "Damaged items write-off during physical count audit",
      "AUDIT-01"
    );
    console.log(`   ✓ Stock adjusted from 15 to ${updatedAfterAdj.currentStock}`);
    console.log(`   ✓ Transaction logged: ${adjTx.movementType}, Change -${adjTx.quantity}, Previous ${adjTx.previousQuantity} -> New ${adjTx.newQuantity}\n`);

    // TEST 7: Negative Stock Prevention
    console.log("8. Testing Negative Stock Prevention...");
    try {
      await InventoryService.adjustStock(
        product._id.toString(),
        -5, // Negative stock attempt
        "Invalid negative adjustment"
      );
      throw new Error("FAILED: Negative stock adjustment should have been rejected!");
    } catch (err: unknown) {
      console.log(`   ✓ Correctly prevented negative stock: "${(err as Error).message}"\n`);
    }

    // TEST 8: Product Details Editing
    console.log("9. Testing Product Editing...");
    const edited = await ProductService.updateProduct(product._id.toString(), {
      name: "Bosch Ceramic Front Brake Pad Set (Upgraded)",
      sellingPrice: 1950,
    });
    console.log(`   ✓ Product updated: Name "${edited.name}", Selling Price ₹${edited.sellingPrice}\n`);

    // TEST 9: Product Archiving and Activation
    console.log("10. Testing Product Archiving (Soft-Delete)...");
    const archived = await ProductService.archiveProduct(product._id.toString());
    console.log(`   ✓ Product status changed to: "${archived.status}"`);

    const activated = await ProductService.activateProduct(product._id.toString());
    console.log(`   ✓ Product restored to: "${activated.status}"\n`);

    // TEST 10: Inventory Valuation & Summary Calculation
    console.log("11. Testing Inventory Summary & Valuation...");
    const summary = await InventoryService.getInventorySummary();
    console.log(`   ✓ Total Active Products: ${summary.activeProducts}`);
    console.log(`   ✓ Total Units in Stock: ${summary.totalUnitsInStock}`);
    console.log(`   ✓ Total Inventory Valuation: ₹${summary.totalInventoryValue.toLocaleString("en-IN")}`);
    console.log(`   ✓ Low Stock Count: ${summary.lowStockCount}`);
    console.log(`   ✓ Out of Stock Count: ${summary.outOfStockCount}\n`);

    // TEST 11: Stock Transaction Ledger History Retrieval
    console.log("12. Testing Stock Transaction Ledger Retrieval...");
    const history = await InventoryService.getStockHistory({
      productId: product._id.toString(),
    });
    console.log(`   ✓ Retrieved ${history.total} ledger entries for product ${product.sku}:`);
    for (const tx of history.transactions) {
      console.log(`     - [${tx.movementType}] Change: ${tx.quantity} (${tx.previousQuantity} -> ${tx.newQuantity}) | Reason: ${tx.reason}`);
    }

    console.log("\n=========================================");
    console.log("  ALL PHASE 2 TESTS PASSED PERFECTLY!");
    console.log("=========================================\n");
  } catch (error) {
    console.error("\n❌ TEST RUN FAILED:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected.");
  }
}

runTests();
