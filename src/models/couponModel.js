import mongoose, { Schema } from 'mongoose';


const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    discountPercentage: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true
    },
    startDate: {
        type: Date,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        required: true
    },
    specializationId: {
        type: Schema.Types.ObjectId,
        ref: 'Specialization',
        required: true
    }
})

export const Coupon = mongoose.model('Coupon', couponSchema);