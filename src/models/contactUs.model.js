import mongoose from "mongoose";

const ContactUsSchema = new mongoose.Schema(
  {
    senderName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    senderEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    senderMobile: {
      type: Number,
      required: true,
      trim: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["resolved", "pending", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);
export const ContactUS = mongoose.model("ContactUS", ContactUsSchema);
