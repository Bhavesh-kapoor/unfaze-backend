import mongoose from "mongoose";
const transactionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: function () {
        return this.type === 'course';
      }
    },
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
    type: {
      type: String,
      enum: ['single', 'course']
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      required: function () {
        return this.type === 'single';
      }
    },
    start_time: {
      type: Date,
      required: function () {
        return this.type === 'single';
      }
    },
    end_time: {
      type: Date,
      required: function () {
        return this.type === 'single';
      }
    },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
