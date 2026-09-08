import { connectToDatabase } from "../src/lib/db/connection";
import { SettingsService } from "../src/services/settings.service";
import { ProductService } from "../src/services/product.service";
import { InventoryService } from "../src/services/inventory.service";
import { InvoiceService } from "../src/services/invoice.service";
import { DashboardService } from "../src/services/dashboard.service";
import { ReportsService } from "../src/services/reports.service";
import { Product } from "../src/models/Product";
import { Invoice } from "../src/models/Invoice";
import { StockTransaction } from "../src/models/StockTransaction";

async function runPhase5E2ETests() {
  console.log("=========================================================");
  console.log("  PHASE 5: COMPREHENSIVE PRODUCTION-READINESS E2E TESTS  ");
  console.log("=========================================================");

  try {
    await connectToDatabase();
    console.log("✓ Connected to MongoDB");

    // -----------------------------------------------------------------
    // STEP 1: Shop Settings Configuration & Unique Sequence Setup
    // -----------------------------------------------------------------
    console.log("\n--- STEP 1: Shop Settings Update & Preview ---");
    const updatedSettings = await SettingsService.updateSettings({
      shopName: "Apex Auto Spares & Performance Garage",
      address: "Plot 108, Auto Hub, Industrial Area",
      city: "Mumbai",
      state: "Maharashtra",
      stateCode: "27",
      pincode: "400093",
      phone: "+91 98765 00000",
      email: "contact@apexgarage.in",
      gstin: "27ABCDE1234F1Z5",
      invoicePrefix: "APEX-26-",
      startingInvoiceNumber: 1,
      termsAndConditions: [
        "1. Goods once sold will not be returned without original receipt.",
        "2. Electrical components carry manufacturer warranty only.",
      ],
      invoiceFooter: "Thank you for choosing Apex Auto! Safe Driving.",
      bankDetails: {
        accountName: "Apex Auto Spares",
        accountNumber: "50200012345678",
        bankName: "HDFC Bank",
        ifscCode: "HDFC0000123",
        upiId: "apexauto@okhdfcbank",
      },
    });

    console.log(`  Shop Name: ${updatedSettings.shopName}`);
    console.log(`  Invoice Prefix: ${updatedSettings.invoicePrefix}`);
    console.log(`  Invoice Footer: ${updatedSettings.invoiceFooter}`);
    const nextInvoicePreview = await SettingsService.previewNextInvoiceNumber();
    console.log(`  Next Invoice Number Preview: ${nextInvoicePreview}`);
    console.log("✓ Step 1 Passed: Shop Settings updated successfully.");

    // -----------------------------------------------------------------
    // STEP 2: Create Test Automotive Product
    // -----------------------------------------------------------------
    console.log("\n--- STEP 2: Product Creation ---");
    const testSku = `P5-PLUG-${Date.now().toString().slice(-4)}`;
    const product = await ProductService.createProduct({
      name: "Denso Iridium Power Spark Plug Set",
      sku: testSku,
      category: "Ignition & Electricals",
      brand: "Denso",
      hsn: "8511",
      purchasePrice: 1500,
      sellingPrice: 2400,
      gstRate: 18,
      currentStock: 0,
      minStockLevel: 5,
      unit: "set",
    });

    console.log(`  Created Product: ${product.name} (SKU: ${product.sku}, Stock: ${product.currentStock})`);
    if (product.currentStock !== 0) throw new Error("Initial stock must be 0");
    console.log("✓ Step 2 Passed: Product created.");

    // -----------------------------------------------------------------
    // STEP 3: Add Stock (Stock In)
    // -----------------------------------------------------------------
    console.log("\n--- STEP 3: Stock In ---");
    const stockInResult = await InventoryService.addStock(
      product._id.toString(),
      20,
      "Initial supplier batch delivery",
      "PO-DENSO-2026"
    );

    console.log(`  Stock after Stock In: ${stockInResult.product.currentStock} units`);
    if (stockInResult.product.currentStock !== 20) throw new Error("Stock should be 20");
    console.log("✓ Step 3 Passed: Stock added and logged.");

    // -----------------------------------------------------------------
    // STEP 4: Create Intra-State Invoice (CGST + SGST)
    // -----------------------------------------------------------------
    console.log("\n--- STEP 4: Create Intra-State Invoice & Verify GST ---");
    const invoice1 = await InvoiceService.createInvoice({
      placeOfSupply: "Maharashtra",
      isInterState: false,
      customerInfo: {
        name: "Vikram Sharma",
        phone: "+91 91234 56789",
        vehicleNumber: "MH 02 AB 1234",
      },
      items: [
        {
          productId: product._id.toString(),
          quantity: 4, // 4 * 2400 = 9600 taxable
        },
      ],
    });

    console.log(`  Invoice Created: #${invoice1.invoiceNumber}`);
    console.log(`  Taxable Subtotal: ₹${invoice1.subtotal}`);
    console.log(`  CGST (9%): ₹${invoice1.totalCgst}, SGST (9%): ₹${invoice1.totalSgst}, IGST: ₹${invoice1.totalIgst}`);
    console.log(`  Grand Total: ₹${invoice1.grandTotal}`);
    console.log(`  Shop Snapshot Footer: "${invoice1.shopSnapshot.invoiceFooter}"`);
    console.log(`  Shop Snapshot Bank: ${invoice1.shopSnapshot.bankDetails?.bankName}`);

    // Verify mathematical correctness
    if (invoice1.subtotal !== 9600) throw new Error(`Expected subtotal 9600, got ${invoice1.subtotal}`);
    if (invoice1.totalCgst !== 864 || invoice1.totalSgst !== 864) {
      throw new Error(`Expected CGST/SGST 864, got ${invoice1.totalCgst}/${invoice1.totalSgst}`);
    }
    if (invoice1.grandTotal !== 11328) throw new Error(`Expected grandTotal 11328, got ${invoice1.grandTotal}`);
    console.log("✓ Step 4 Passed: Intra-State GST calculated and snapshotted correctly.");

    // -----------------------------------------------------------------
    // STEP 5: Verify Stock Deduction
    // -----------------------------------------------------------------
    console.log("\n--- STEP 5: Verify Stock Deduction ---");
    const productAfterSale = await Product.findById(product._id);
    console.log(`  Product stock after sale: ${productAfterSale?.currentStock} (Expected: 16)`);
    if (productAfterSale?.currentStock !== 16) throw new Error("Stock was not deducted correctly");

    const saleTx = await StockTransaction.findOne({
      productId: product._id,
      movementType: "SALE",
      referenceInvoiceNumber: invoice1.invoiceNumber,
    });
    if (!saleTx) throw new Error("SALE stock transaction not found");
    console.log(`  Found SALE Transaction: ${saleTx.quantity} units, previous=${saleTx.previousQuantity}, new=${saleTx.newQuantity}`);
    console.log("✓ Step 5 Passed: Stock deduction and ledger verified.");

    // -----------------------------------------------------------------
    // STEP 6: Historical Snapshot Immutability Test
    // -----------------------------------------------------------------
    console.log("\n--- STEP 6: Historical Snapshot Immutability Test ---");
    // Modify product price in catalog
    await Product.findByIdAndUpdate(product._id, { sellingPrice: 3500 });
    // Modify shop settings
    await SettingsService.updateSettings({
      ...updatedSettings.toObject(),
      shopName: "Changed Shop Name Test",
    });

    // Fetch the historical invoice from database
    const fetchedOldInvoice = await Invoice.findById(invoice1._id);
    console.log(`  Old Invoice #${fetchedOldInvoice?.invoiceNumber}:`);
    console.log(`    Item Price in Snapshot: ₹${fetchedOldInvoice?.items[0].unitPrice} (Expected: ₹2400)`);
    console.log(`    Shop Name in Snapshot: "${fetchedOldInvoice?.shopSnapshot.shopName}" (Expected: "Apex Auto Spares & Performance Garage")`);

    if (fetchedOldInvoice?.items[0].unitPrice !== 2400) {
      throw new Error("Historical invoice item price mutated!");
    }
    if (fetchedOldInvoice?.shopSnapshot.shopName !== "Apex Auto Spares & Performance Garage") {
      throw new Error("Historical invoice shop snapshot mutated!");
    }
    console.log("✓ Step 6 Passed: Historical invoice is 100% immutable.");

    // -----------------------------------------------------------------
    // STEP 7: Cancel Invoice & Verify Stock Restoration
    // -----------------------------------------------------------------
    console.log("\n--- STEP 7: Cancel Invoice & Stock Restoration ---");
    const cancelledInvoice = await InvoiceService.cancelInvoice(
      invoice1._id.toString(),
      "Customer returned parts for credit"
    );

    console.log(`  Invoice Status: ${cancelledInvoice.status}`);
    console.log(`  Cancellation Reason: "${cancelledInvoice.cancellationReason}"`);

    const productAfterCancel = await Product.findById(product._id);
    console.log(`  Product stock after cancellation: ${productAfterCancel?.currentStock} (Expected: 20 restored)`);
    if (productAfterCancel?.currentStock !== 20) throw new Error("Stock was not restored upon cancellation");

    const reversalTx = await StockTransaction.findOne({
      productId: product._id,
      movementType: "SALE_REVERSAL",
      referenceInvoiceNumber: invoice1.invoiceNumber,
    });
    if (!reversalTx) throw new Error("SALE_REVERSAL transaction not found");
    console.log(`  Found SALE_REVERSAL Transaction: ${reversalTx.quantity} units restored.`);
    console.log("✓ Step 7 Passed: Invoice cancellation and stock reversal verified.");

    // -----------------------------------------------------------------
    // STEP 8: Create Inter-State Invoice (IGST)
    // -----------------------------------------------------------------
    console.log("\n--- STEP 8: Inter-State Tax (IGST) ---");
    const invoice2 = await InvoiceService.createInvoice({
      placeOfSupply: "Gujarat",
      isInterState: true,
      customerInfo: {
        name: "Gujarat Motors",
      },
      items: [
        {
          productId: product._id.toString(),
          quantity: 2, // 2 * 3500 = 7000 taxable (since price was updated to 3500)
        },
      ],
    });

    console.log(`  Inter-State Invoice #${invoice2.invoiceNumber}:`);
    console.log(`    Taxable: ₹${invoice2.subtotal}`);
    console.log(`    CGST: ₹${invoice2.totalCgst}, SGST: ₹${invoice2.totalSgst}, IGST (18%): ₹${invoice2.totalIgst}`);
    console.log(`    Grand Total: ₹${invoice2.grandTotal}`);

    if (invoice2.totalCgst !== 0 || invoice2.totalSgst !== 0 || invoice2.totalIgst !== 1260) {
      throw new Error(`IGST calculation incorrect: CGST=${invoice2.totalCgst}, SGST=${invoice2.totalSgst}, IGST=${invoice2.totalIgst}`);
    }
    console.log("✓ Step 8 Passed: Inter-State IGST verified.");

    // -----------------------------------------------------------------
    // STEP 9: Negative Stock Prevention
    // -----------------------------------------------------------------
    console.log("\n--- STEP 9: Negative Stock Prevention ---");
    let threwStockError = false;
    try {
      await InvoiceService.createInvoice({
        items: [
          {
            productId: product._id.toString(),
            quantity: 999, // Way more than available (18)
          },
        ],
      });
    } catch (e: unknown) {
      threwStockError = true;
      console.log(`  Caught expected error: "${(e as Error).message}"`);
    }
    if (!threwStockError) throw new Error("Failed to prevent negative stock sale!");
    console.log("✓ Step 9 Passed: Negative stock prevention active.");

    // -----------------------------------------------------------------
    // STEP 10: Archived Product Prevention
    // -----------------------------------------------------------------
    console.log("\n--- STEP 10: Archived Product Prevention ---");
    await ProductService.archiveProduct(product._id.toString());
    let threwArchiveError = false;
    try {
      await InvoiceService.createInvoice({
        items: [
          {
            productId: product._id.toString(),
            quantity: 1,
          },
        ],
      });
    } catch (e: unknown) {
      threwArchiveError = true;
      console.log(`  Caught expected error: "${(e as Error).message}"`);
    }
    if (!threwArchiveError) throw new Error("Failed to block billing on archived product!");
    // Un-archive for subsequent checks
    await ProductService.activateProduct(product._id.toString());
    console.log("✓ Step 10 Passed: Archived products cannot be billed.");

    // -----------------------------------------------------------------
    // STEP 11: Invoice Number Uniqueness & Counter Non-Reuse
    // -----------------------------------------------------------------
    console.log("\n--- STEP 11: Invoice Number Uniqueness Safeguard ---");
    const num1 = await SettingsService.getNextInvoiceNumber();
    const num2 = await SettingsService.getNextInvoiceNumber();
    console.log(`  Consecutive Numbers Generated: ${num1}, ${num2}`);
    if (num1 === num2) throw new Error("Duplicate invoice numbers generated!");
    console.log("✓ Step 11 Passed: Invoice numbers are strictly unique.");

    // -----------------------------------------------------------------
    // STEP 12: Real Dashboard & Reports Integration
    // -----------------------------------------------------------------
    console.log("\n--- STEP 12: Dashboard & Reports Integration ---");
    const dash = await DashboardService.getDashboardData({ chartPeriod: "daily" });
    console.log(`  Dashboard Today's Sales: ₹${dash.metrics.todaySales}`);
    console.log(`  Dashboard Total Invoices: ${dash.metrics.totalInvoices}`);
    console.log(`  Dashboard Active Products: ${dash.metrics.totalProducts}`);
    console.log(`  Dashboard Insights (${dash.insights.length}):`, dash.insights);

    const gstRep = await ReportsService.getGSTSummaryReport();
    console.log(`  GST Report Total Liability: ₹${gstRep.summary.totalGst}`);
    console.log(`  GST Report Rate Slabs:`, gstRep.byRate);

    console.log("\n=========================================================");
    console.log("  ALL PHASE 5 E2E TESTS PASSED WITH 100% INTEGRITY!      ");
    console.log("=========================================================");
    process.exit(0);
  } catch (err) {
    console.error("❌ Phase 5 Test Failure:", err);
    process.exit(1);
  }
}

runPhase5E2ETests();
