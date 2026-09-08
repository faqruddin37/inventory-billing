export interface IBankDetails {
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  upiId?: string;
}

export interface IShopSettings {
  _id?: string;
  shopName: string;
  logoUrl?: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  phone: string;
  email: string;
  gstin: string;
  invoicePrefix: string;
  startingInvoiceNumber: number;
  termsAndConditions: string[];
  invoiceFooter?: string;
  bankDetails?: IBankDetails;
  updatedAt?: Date;
}
