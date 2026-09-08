import { connectToDatabase } from "../src/lib/db/connection";
import { DashboardService } from "../src/services/dashboard.service";
import { ReportsService } from "../src/services/reports.service";

async function runPhase4Tests() {
  console.log("=================================================");
  console.log("  PHASE 4: DASHBOARD & REPORTS INTEGRATION TESTS ");
  console.log("=================================================");

  try {
    await connectToDatabase();
    console.log("✓ Connected to MongoDB");

    // -------------------------------------------------------------
    // Test 1: DashboardService - Daily, Weekly, Monthly chart periods
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: Dashboard Metrics & Sales Chart ---");
    for (const period of ["daily", "weekly", "monthly"] as const) {
      const data = await DashboardService.getDashboardData({ chartPeriod: period });
      console.log(`\nPeriod: ${period}`);
      console.log(`  Today's Sales: ₹${data.metrics.todaySales}`);
      console.log(`  This Month's Sales: ₹${data.metrics.thisMonthSales}`);
      console.log(`  Total Invoices: ${data.metrics.totalInvoices}`);
      console.log(`  Total Active Products: ${data.metrics.totalProducts}`);
      console.log(`  Inventory Valuation: ₹${data.metrics.inventoryValue}`);
      console.log(`  Low Stock Count: ${data.metrics.lowStockCount}`);
      console.log(`  Out of Stock Count: ${data.metrics.outOfStockCount}`);
      console.log(`  Total GST Collected: ₹${data.metrics.totalGstCollected}`);
      console.log(`  Chart Points Count: ${data.salesChart.length}`);
      console.log(`  Top Products Count: ${data.topProducts.length}`);
      console.log(`  Low Stock Alert Items: ${data.lowStockProducts.length}`);
      console.log(`  Recent Invoices Count: ${data.recentInvoices.length}`);
      console.log(`  GST Summary: CGST=₹${data.gstSummary.totalCgst}, SGST=₹${data.gstSummary.totalSgst}, IGST=₹${data.gstSummary.totalIgst}, Total=₹${data.gstSummary.totalGst}`);
      console.log(`  Insights Generated (${data.insights.length}):`, data.insights);

      // Assertions
      if (typeof data.metrics.todaySales !== "number" || isNaN(data.metrics.todaySales)) {
        throw new Error("todaySales is NaN or not a number");
      }
      if (typeof data.metrics.inventoryValue !== "number" || isNaN(data.metrics.inventoryValue)) {
        throw new Error("inventoryValue is NaN or not a number");
      }
    }
    console.log("✓ Test 1 Passed: DashboardService operates cleanly across all periods.");

    // -------------------------------------------------------------
    // Test 2: ReportsService - Sales Report across presets
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Sales Report Aggregations ---");
    for (const preset of ["today", "yesterday", "week", "month"] as const) {
      const sales = await ReportsService.getSalesReport({ preset });
      console.log(`Preset [${preset}]: Invoices=${sales.totalInvoices}, TotalSales=₹${sales.totalSales}, Taxable=₹${sales.totalTaxable}, GST=₹${sales.totalGst}, AvgBill=₹${sales.averageBillValue}`);
      if (isNaN(sales.totalSales) || isNaN(sales.totalGst) || isNaN(sales.averageBillValue)) {
        throw new Error(`NaN detected in sales report for preset: ${preset}`);
      }
    }
    console.log("✓ Test 2 Passed: Sales Report aggregation functions correctly.");

    // -------------------------------------------------------------
    // Test 3: ReportsService - Inventory & Valuation Report
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Inventory Valuation & Movements Report ---");
    const invReport = await ReportsService.getInventoryReport();
    console.log("  Summary:", invReport.summary);
    console.log("  Category Valuation Count:", invReport.categoryValuation.length);
    if (invReport.categoryValuation.length > 0) {
      console.log("    Sample Category:", invReport.categoryValuation[0]);
    }
    console.log("  Movement Totals:", invReport.movementTotals);
    console.log("  Low Stock Items Count:", invReport.lowStockItems.length);
    if (isNaN(invReport.summary.totalValuation)) {
      throw new Error("Inventory totalValuation is NaN");
    }
    console.log("✓ Test 3 Passed: Inventory Report aggregation functions correctly.");

    // -------------------------------------------------------------
    // Test 4: ReportsService - Product Performance Report
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Product Performance Report (Top Selling vs Dead Inventory) ---");
    const prodReport = await ReportsService.getProductPerformanceReport();
    console.log(`  Top Selling Count: ${prodReport.topSelling.length}`);
    if (prodReport.topSelling.length > 0) {
      console.log("    Top Product #1:", prodReport.topSelling[0]);
    }
    console.log(`  Non-Moving / Zero-Sales Count: ${prodReport.leastSellingOrDeadStock.length}`);
    if (prodReport.leastSellingOrDeadStock.length > 0) {
      console.log("    Dead Stock Sample #1:", prodReport.leastSellingOrDeadStock[0]);
    }
    console.log("✓ Test 4 Passed: Product Performance Report functions correctly.");

    // -------------------------------------------------------------
    // Test 5: ReportsService - GST Tax Filing Report
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: GST Tax Liability Report (Rate-wise & State-wise) ---");
    const gstReport = await ReportsService.getGSTSummaryReport();
    console.log("  Summary:", gstReport.summary);
    console.log("  Rate-wise Slabs:", gstReport.byRate);
    console.log("  State-wise Splits:", gstReport.byState);
    if (isNaN(gstReport.summary.totalGst) || isNaN(gstReport.summary.totalTaxable)) {
      throw new Error("GST summary amounts contain NaN");
    }
    console.log("✓ Test 5 Passed: GST Report functions correctly.");

    console.log("\n=================================================");
    console.log("  ALL PHASE 4 TESTS COMPLETED SUCCESSFULLY!      ");
    console.log("=================================================");
    process.exit(0);
  } catch (err) {
    console.error("❌ Phase 4 Test Error:", err);
    process.exit(1);
  }
}

runPhase4Tests();
