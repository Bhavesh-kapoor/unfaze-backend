import mongoose from "mongoose";

const SpecializationSchema = new mongoose.Schema(
  {
    description: { type: String },
    usdPrice: { type: Number, required: true },
    inrPrice: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);
export const Specialization = mongoose.model(
  "Specialization",
  SpecializationSchema
);
