import mongoose from 'mongoose';

const corpPackage = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    },
    TotalSession: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: true,
        enum: ['USD', 'INR']
    },
    price: {
        type: Number,
        required: true,
    },
    specializationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Specialization",
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    remainingSessions: {
        type: Number,
        required: true,
    }
},
    { timestamps: true }

)

export const CorpPackage = mongoose.model('CorpPackage', corpPackage);