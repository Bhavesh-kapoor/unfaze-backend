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
        unique: true,
        trim: true,
    },
    discountPercentage: {
        type: Number,
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
    usedCount: {
        type: Number,
        default: 0
    },
    specializationId: {
        type: Schema.Types.ObjectId,
        ref: 'Specialization',
        required: true
    }
});

// Add a schema-level validation function to check discount logic
couponSchema.pre('validate', function (next) {
    if (this.type === 'percentage' && (this.discountPercentage == null || this.discountPercentage <= 0)) {
        return next(new Error('discountPercentage is required and must be greater than 0 when type is "percentage"'));
    }
    
    if (this.type === 'fixed' && (this.fixDiscount == null || this.fixDiscount <= 0)) {
        return next(new Error('fixDiscount is required and must be greater than 0 when type is "fixed"'));
    }

    next();
});
couponSchema.pre('save', function (next) {
    this.code = this.code.toUpperCase();
    next();
});

export const Coupon = mongoose.model('Coupon', couponSchema);
