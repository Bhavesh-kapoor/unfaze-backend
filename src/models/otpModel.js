import mongoose,{ Schema } from "mongoose";

const otpSchema = new Schema({
    email: { type: String},
    mobile:{type:Number},
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 }
})

export const OTP = mongoose.model("Otp",otpSchema);
