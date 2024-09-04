import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: 'string',
        required: true,
        unique: true
    },
    category:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Specialization',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    therapist_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist',
        required: true
    },
    payment_details: {
        type: Object,
        default: {}
    },
    amount: {
        type: Number,
        required: true
    },
    payment_status: {
        type: String,
    },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },

}, { timestamps: true });

export const Transaction = mongoose.model('Transaction', transactionSchema);