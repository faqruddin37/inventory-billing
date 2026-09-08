import { connectToDatabase } from "@/lib/db/connection";
import { ShopSettings, IShopSettingsDocument } from "@/models/ShopSettings";
import { Counter } from "@/models/Counter";
import { Invoice } from "@/models/Invoice";
import { ShopSettingsInput } from "@/lib/validations/settings.schema";

export class SettingsService {
  /**
   * Retrieves current shop settings or creates initial default settings if none exist
   */
  static async getSettings(): Promise<IShopSettingsDocument> {
    await connectToDatabase();

    let settings = await ShopSettings.findOne();

    if (!settings) {
      settings = await ShopSettings.create({
        shopName: "Apex Auto Spares & Garage",
        logoUrl: "",
        address: "Shop No. 4, Motor Market, Main Road",
        city: "Mumbai",
        state: "Maharashtra",
        stateCode: "27",
        pincode: "400001",
        phone: "+91 98765 43210",
        email: "contact@apexautospares.com",
        gstin: "27ABCDE1234F1Z5",
        invoicePrefix: "INV-",
        startingInvoiceNumber: 1,
        termsAndConditions: [
          "Goods once sold will not be taken back or exchanged without a valid receipt.",
          "Warranty as per respective spare parts manufacturer policy.",
          "Subject to local court jurisdiction.",
        ],
        invoiceFooter: "Thank you for your business! Drive safely.",
        bankDetails: {
          accountName: "Apex Auto Spares",
          accountNumber: "987654321000",
          bankName: "HDFC Bank",
          ifscCode: "HDFC0001234",
          upiId: "apexauto@okhdfcbank",
        },
      });
    }

    return settings;
  }

  /**
   * Updates shop settings with invoice sequence protection
   */
  static async updateSettings(input: ShopSettingsInput): Promise<IShopSettingsDocument> {
    await connectToDatabase();

    let settings = await ShopSettings.findOne();

    // Check counter sequence if startingInvoiceNumber was changed
    if (input.startingInvoiceNumber) {
      const counter = await Counter.findById("invoice_number");
      const currentSeq = counter ? counter.seq : 0;

      // If user sets a higher starting number, advance counter sequence
      if (input.startingInvoiceNumber > currentSeq) {
        await Counter.findByIdAndUpdate(
          "invoice_number",
          { seq: input.startingInvoiceNumber - 1 },
          { upsert: true }
        );
      }
    }

    if (!settings) {
      settings = new ShopSettings(input);
    } else {
      Object.assign(settings, input);
    }

    await settings.save();
    return settings;
  }

  /**
   * Previews the next invoice number based on current settings and counter without incrementing
   */
  static async previewNextInvoiceNumber(): Promise<string> {
    await connectToDatabase();

    const settings = await this.getSettings();
    const prefix = settings.invoicePrefix || "INV-";
    const startSeq = settings.startingInvoiceNumber || 1;

    const counter = await Counter.findById("invoice_number");
    const nextSeq = counter ? Math.max(counter.seq + 1, startSeq) : startSeq;

    const padded = nextSeq.toString().padStart(6, "0");
    return `${prefix}${padded}`;
  }

  /**
   * Atomically generates the next sequential invoice number with configurable prefix and zero padding.
   * Guarantees uniqueness by looping until an unused invoice number is found.
   * Example: INV-000001, INV-000002
   */
  static async getNextInvoiceNumber(): Promise<string> {
    await connectToDatabase();

    const settings = await this.getSettings();
    const prefix = settings.invoicePrefix || "INV-";
    const startSeq = settings.startingInvoiceNumber || 1;

    let candidateNumber = "";
    let isUnique = false;

    while (!isUnique) {
      const counter = await Counter.findByIdAndUpdate(
        "invoice_number",
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      let currentSeq = counter.seq;
      if (currentSeq < startSeq) {
        await Counter.findByIdAndUpdate("invoice_number", { seq: startSeq });
        currentSeq = startSeq;
      }

      const padded = currentSeq.toString().padStart(6, "0");
      candidateNumber = `${prefix}${padded}`;

      // Check if candidate already exists in Invoice collection
      const existing = await Invoice.findOne({ invoiceNumber: candidateNumber });
      if (!existing) {
        isUnique = true;
      }
    }

    return candidateNumber;
  }
}
