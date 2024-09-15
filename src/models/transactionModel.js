import mongoose from "mongoose";
const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: "string",
      required: true,
      unique: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Specialization",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
    },
    payment_details: {
      type: Object,
      default: {},
    },
    amount_USD: {
      type: Number,
      default: 0,
    },
    rate_USD: {
      type: Number,
      default: 0,
    },
    amount_INR: {
      type: Number,
      default: 0,
    },
    payment_status: {
      type: String,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      required: true,
    },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
