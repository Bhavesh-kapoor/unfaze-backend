import mongoose from "mongoose";

const RefundSchema = new mongoose.Schema({
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
        required: true,
    },
    refundReason: {
        type: String,
        required: true,
    },
    refundDate: {
        type: Date,
        required: true,
    },
    refundStatus: {
        type: String,
        enum: ["pending", "rejected", "approved"],
        default: "pending",
    },
})

export const Refund = mongoose.model("Refund", RefundSchema);