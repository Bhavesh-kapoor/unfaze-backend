import mongoose, { Schema } from 'mongoose';

const couponSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['percentage', 'fixed']
    },
    currencyType: {
        type: String,
        required: true,
        enum: ['INR', 'USD']
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    discountPercentage: {
        type: Number,
        required: true
    },
    fixDiscount: {
        type: Number,
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        required: true
    },
    usedCount:{
        type: Number,
        default: 0
    },
    specializationId: {
        type: Schema.Types.ObjectId,
        ref: 'Specialization',
        required: true
    }
})

export const Coupon = mongoose.model('Coupon', couponSchema);