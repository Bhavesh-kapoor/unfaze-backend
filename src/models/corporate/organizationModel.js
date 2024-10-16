import mongoose from 'mongoose';

const OrganizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 100,
        trim: true,
    },
    industry: {
        type: String,
        enum: ['corporate', 'education', 'non-profit', 'government'],
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/\S+@\S+\.\S+/, 'is invalid'],
    },
    phone: {
        type: String,
        required: true,
        match: [/^\d{10,15}$/, 'Phone number should be between 10 and 15 digits.'],
    },
    address: {
        addressLine: { type: String, required: true, maxlength: 100 },
        city: { type: String, required: true, maxlength: 50 },
        state: { type: String, required: true, maxlength: 50 },
        country: { type: String, required: true, maxlength: 50, default: "india" },
        pincode: {
            type: String,
            required: true,
        },
    },
    website: {
        type: String,
        match: [/^https?:\/\/[^\s/$.?#].[^\s]*$/, 'Invalid website URL format'],
        maxlength: 100,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

export const Organization = mongoose.model('Organization', OrganizationSchema);
