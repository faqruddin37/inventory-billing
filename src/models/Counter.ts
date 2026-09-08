import mongoose, { Schema, Model, Document } from "mongoose";

export interface ICounterDocument extends Document<string> {
  _id: string; // Identifier e.g. "invoice_number"
  seq: number;
}

const CounterSchema = new Schema<ICounterDocument>(
  {
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: false,
    _id: false, // Prevents Mongoose from trying to treat string _id as ObjectId auto-generator
  }
);

export const Counter: Model<ICounterDocument> =
  mongoose.models.Counter || mongoose.model<ICounterDocument>("Counter", CounterSchema);
