
import mongoose, { Schema } from "mongoose";

const packageDistSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        mainPackageId: {
            type: Schema.Types.ObjectId,
            ref: "CorpPackage",
            required: true,
        },
        sesAllotted: {
            type: Number,
            required: true,
            min: 0,
        },
        used: {
            type: Number,
            required: true,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true,
        }
    },
    { timestamps: true }
);
export const PackageDistribution = mongoose.model("PackageDistribution", packageDistSchema);
