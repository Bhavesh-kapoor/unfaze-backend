import mongoose from "mongoose";

const thatherapistPaySchema = new mongoose.Schema({
    therapistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Therapist",
        required: true
    },
    specializationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Specialization",
        required: true
    },
    inrPay: {
        type: Number,
        required: true,
        default: 0
    },
    usdPay: {
        type: Number,
        required: true,
        default: 0
    },
    count: {
        type: Number,
        required: true,
        default: 0
    }
}, { timestamps: true });

export const TherapistPay = mongoose.model("TherapistPay", thatherapistPaySchema);