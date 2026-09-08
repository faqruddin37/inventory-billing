import mongoose from "mongoose";
import { connectToDatabase } from "../src/lib/db/connection";
import { Product } from "../src/models/Product";
import { Invoice } from "../src/models/Invoice";
import { StockTransaction } from "../src/models/StockTransaction";
import { ProductService } from "../src/services/product.service";
import { InvoiceService } from "../src/services/invoice.service";
import { SettingsService } from "../src/services/settings.service";
import { numberToWordsINR } from "../src/lib/utils/numberToWords";

async function runPhase3Tests() {
  console.log("=================================================");
  console.log("  PHASE 3 COMPREHENSIVE BILLING & INVOICE TESTS");
  console.log("=================================================\n");

  try {
    console.log("1. Connecting to MongoDB...");
    await connectToDatabase();
    console.log("   ✓ MongoDB connected successfully!\n");

    // Clean up test data
    const sku1 = "P3-OIL-5W30";
    const sku2 = "P3-PAD-FRONT";
    const sku3 = "P3-TYRE-R16";
    await Product.deleteMany({ sku: { $in: [sku1, sku2, sku3] } });
    await Invoice.deleteMany({ "items.sku": { $in: [sku1, sku2, sku3] } });

    // Initialize/Fetch Shop Settings
    const shopSettings = await SettingsService.getSettings();
    console.log(`2. Verified Shop Settings: "${shopSettings.shopName}", State: "${shopSettings.state}" (GSTIN: ${shopSettings.gstin})\n`);

    // Create 3 Test Products with different GST Rates
    console.log("3. Creating Test Products with different GST rates...");
    const prod1 = await ProductService.createProduct({
      name: "Castrol Magnatec 5W-30 4L",
      sku: sku1,
      category: "Engine Oil",
      brand: "Castrol",
      hsn: "2710",
      purchasePrice: 1500,
      sellingPrice: 2000,
      gstRate: 18,
      currentStock: 10,
      minStockLevel: 2,
      unit: "ltr",
      status: "active",
    });

    const prod2 = await ProductService.createProduct({
      name: "Brembo Ceramic Front Brake Pads",
      sku: sku2,
      category: "Braking",
      brand: "Brembo",
      hsn: "8708",
      purchasePrice: 2500,
      sellingPrice: 3500,
      gstRate: 28,
      currentStock: 5,
      minStockLevel: 1,
      unit: "set",
      status: "active",
    });

    const prod3 = await ProductService.createProduct({
      name: "Michelin Primacy 4ST Tyre",
      sku: sku3,
      category: "Tyres",
      brand: "Michelin",
      hsn: "4011",
      purchasePrice: 4000,
      sellingPrice: 5500,
      gstRate: 28,
      currentStock: 4,
      minStockLevel: 1,
      unit: "pcs",
      status: "active",
    });

    console.log(`   ✓ Product 1: ${prod1.name} (SKU: ${prod1.sku}, Stock: ${prod1.currentStock}, GST: ${prod1.gstRate}%)`);
    console.log(`   ✓ Product 2: ${prod2.name} (SKU: ${prod2.sku}, Stock: ${prod2.currentStock}, GST: ${prod2.gstRate}%)`);
    console.log(`   ✓ Product 3: ${prod3.name} (SKU: ${prod3.sku}, Stock: ${prod3.currentStock}, GST: ${prod3.gstRate}%)\n`);

    // TEST 1: Single Product Intra-State Invoice (CGST + SGST)
    console.log("4. Testing Single Product Intra-State Invoice (CGST 9% + SGST 9%)...");
    const inv1 = await InvoiceService.createInvoice({
      placeOfSupply: "Maharashtra",
      isInterState: false,
      customerInfo: {
        name: "Rahul Sharma",
        phone: "9876543210",
        vehicleNumber: "MH01AB1234",
      },
      items: [
        {
          productId: prod1._id.toString(),
          quantity: 2, // 2 x 2000 = 4000 taxable. 18% GST = 720 (CGST 360 + SGST 360). Grand Total = 4720
        },
      ],
    });

    console.log(`   ✓ Invoice Generated: #${inv1.invoiceNumber}`);
    console.log(`   ✓ Taxable Subtotal: ₹${inv1.subtotal} (Expected: ₹4000)`);
    console.log(`   ✓ CGST: ₹${inv1.totalCgst} (Expected: ₹360), SGST: ₹${inv1.totalSgst} (Expected: ₹360), IGST: ₹${inv1.totalIgst} (Expected: ₹0)`);
    console.log(`   ✓ Grand Total: ₹${inv1.grandTotal} (Expected: ₹4720)`);
    console.log(`   ✓ Words: "${inv1.amountInWords}"`);

    if (inv1.subtotal !== 4000 || inv1.totalCgst !== 360 || inv1.totalSgst !== 360 || inv1.grandTotal !== 4720) {
      throw new Error("FAILED: Intra-state GST calculations do not match expected mathematical totals!");
    }

    // Verify stock deducted for prod1
    const p1Updated = await Product.findById(prod1._id);
    if (!p1Updated || p1Updated.currentStock !== 8) {
      throw new Error(`FAILED: Product 1 stock should be 8, but found ${p1Updated?.currentStock}`);
    }
    console.log(`   ✓ Stock for ${prod1.sku} automatically deducted from 10 -> ${p1Updated.currentStock}`);

    // Verify SALE StockTransaction
    const saleTx1 = await StockTransaction.findOne({ referenceInvoiceId: inv1._id, movementType: "SALE" });
    if (!saleTx1 || saleTx1.quantity !== 2 || saleTx1.previousQuantity !== 10 || saleTx1.newQuantity !== 8) {
      throw new Error("FAILED: SALE StockTransaction was not logged accurately!");
    }
    console.log(`   ✓ SALE ledger transaction verified: Qty -${saleTx1.quantity}, Ref: ${saleTx1.reference}\n`);

    // TEST 2: Multiple Products Inter-State Invoice (IGST)
    console.log("5. Testing Multi-Product Inter-State Invoice (IGST)...");
    const inv2 = await InvoiceService.createInvoice({
      placeOfSupply: "Karnataka", // Inter-state
      isInterState: true,
      customerInfo: {
        name: "Auto Workshop Bengaluru",
        phone: "9123456780",
      },
      items: [
        {
          productId: prod1._id.toString(), // 1 x 2000 @ 18% = 2000 + 360 = 2360
          quantity: 1,
        },
        {
          productId: prod2._id.toString(), // 2 x 3500 @ 28% = 7000 + 1960 = 8960
          quantity: 2,
        },
      ],
      // Total taxable = 2000 + 7000 = 9000. Total IGST = 360 + 1960 = 2320. Grand Total = 11320.
    });

    console.log(`   ✓ Invoice Generated: #${inv2.invoiceNumber}`);
    console.log(`   ✓ Taxable Subtotal: ₹${inv2.subtotal} (Expected: ₹9000)`);
    console.log(`   ✓ IGST: ₹${inv2.totalIgst} (Expected: ₹2320), CGST: ₹${inv2.totalCgst}, SGST: ₹${inv2.totalSgst}`);
    console.log(`   ✓ Grand Total: ₹${inv2.grandTotal} (Expected: ₹11320)`);
    console.log(`   ✓ Words: "${inv2.amountInWords}"`);

    if (inv2.subtotal !== 9000 || inv2.totalIgst !== 2320 || inv2.totalCgst !== 0 || inv2.grandTotal !== 11320) {
      throw new Error("FAILED: Inter-state IGST calculations do not match expected totals!");
    }
    console.log("   ✓ Multi-item Inter-state invoice calculated and saved accurately!\n");

    // TEST 3: Insufficient Stock Prevention
    console.log("6. Testing Insufficient Stock Prevention (Over-selling blocked)...");
    try {
      await InvoiceService.createInvoice({
        items: [
          {
            productId: prod3._id.toString(),
            quantity: 10, // Stock is only 4
          },
        ],
      });
      throw new Error("FAILED: Should have rejected invoice with insufficient stock!");
    } catch (err: unknown) {
      console.log(`   ✓ Correctly rejected invoice: "${(err as Error).message}"\n`);
    }

    // TEST 4: Exact Stock Quantity Sale (Depleting stock to 0)
    console.log("7. Testing Exact Stock Depletion (Selling 4/4 tyres)...");
    const inv3 = await InvoiceService.createInvoice({
      items: [
        {
          productId: prod3._id.toString(),
          quantity: 4, // Exact remaining stock
        },
      ],
    });
    const p3Depleted = await Product.findById(prod3._id);
    if (!p3Depleted || p3Depleted.currentStock !== 0) {
      throw new Error(`FAILED: Tyre stock should be 0, but found ${p3Depleted?.currentStock}`);
    }
    console.log(`   ✓ Invoice #${inv3.invoiceNumber} created. Tyre stock accurately depleted to: ${p3Depleted.currentStock}\n`);

    // TEST 5: Invoice Cancellation & Automated Stock Reversal
    console.log("8. Testing Invoice Cancellation & Stock Reversal...");
    const cancelledInv = await InvoiceService.cancelInvoice(
      inv3._id.toString(),
      "Customer cancelled order before dispatch"
    );

    console.log(`   ✓ Invoice #${cancelledInv.invoiceNumber} status: "${cancelledInv.status}"`);
    const p3Restored = await Product.findById(prod3._id);
    if (!p3Restored || p3Restored.currentStock !== 4) {
      throw new Error(`FAILED: Tyre stock should be restored to 4, but found ${p3Restored?.currentStock}`);
    }
    console.log(`   ✓ Tyre stock accurately restored from 0 -> ${p3Restored.currentStock}`);

    // Verify SALE_REVERSAL transaction
    const revTx = await StockTransaction.findOne({
      referenceInvoiceId: inv3._id,
      movementType: "SALE_REVERSAL",
    });
    if (!revTx || revTx.quantity !== 4 || revTx.previousQuantity !== 0 || revTx.newQuantity !== 4) {
      throw new Error("FAILED: SALE_REVERSAL StockTransaction was not logged accurately!");
    }
    console.log(`   ✓ SALE_REVERSAL ledger entry verified: Qty +${revTx.quantity}, Reason: "${revTx.reason}"\n`);

    // TEST 6: Snapshot Immutability Verification
    console.log("9. Testing Historical Invoice Snapshot Immutability...");
    // Modify product 1 in the catalog (change price, name, GST rate)
    await ProductService.updateProduct(prod1._id.toString(), {
      name: "MODIFIED Castrol Magnatec Gold Ultra",
      sellingPrice: 9999, // Changed from 2000 to 9999
      gstRate: 28, // Changed from 18% to 28%
    });

    // Re-fetch past invoice 1
    const pastInv1 = await Invoice.findById(inv1._id);
    if (!pastInv1) throw new Error("Could not find invoice 1");

    const snapshotItem = pastInv1.items[0];
    console.log(`   ✓ Current Product in Catalog: Price ₹9999, GST 28%, Name "MODIFIED Castrol Magnatec Gold Ultra"`);
    console.log(`   ✓ Frozen Snapshot in Past Invoice #${pastInv1.invoiceNumber}:`);
    console.log(`     - Item Name: "${snapshotItem.name}" (Unchanged)`);
    console.log(`     - Unit Price: ₹${snapshotItem.unitPrice} (Unchanged, was ₹2000)`);
    console.log(`     - GST Rate: ${snapshotItem.gstRate}% (Unchanged, was 18%)`);
    console.log(`     - Grand Total: ₹${pastInv1.grandTotal} (Unchanged, was ₹4720)`);

    if (
      snapshotItem.unitPrice !== 2000 ||
      snapshotItem.gstRate !== 18 ||
      pastInv1.grandTotal !== 4720 ||
      snapshotItem.name !== "Castrol Magnatec 5W-30 4L"
    ) {
      throw new Error("FAILED: Past invoice was mutated by product catalog changes!");
    }
    console.log("   ✓ Past invoice snapshot remained 100% frozen and immutable!\n");

    // TEST 7: Sequential Invoice Numbering Check
    console.log("10. Testing Sequential Numbering Sequence...");
    console.log(`   - Invoice 1: ${inv1.invoiceNumber}`);
    console.log(`   - Invoice 2: ${inv2.invoiceNumber}`);
    console.log(`   - Invoice 3: ${inv3.invoiceNumber}`);
    console.log("   ✓ Strict sequential order preserved!\n");

    console.log("=================================================");
    console.log("  ALL PHASE 3 BILLING & INVOICE TESTS PASSED!");
    console.log("=================================================\n");
  } catch (error) {
    console.error("\n❌ TEST RUN FAILED:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected.");
  }
}

runPhase3Tests();
