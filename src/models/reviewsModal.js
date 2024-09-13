import mongoose, { Schema } from "mongoose";

const Rating = [1, 2, 3, 4, 5];

const customerSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  userId: { type: String, required: true },
});

const customerFeedbackSchema = new Schema({
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Therapist",
  },
  message: { type: String, default: "" },
  isActive: { type: Boolean, default: false },
  customer: { type: customerSchema, required: true },
  rating: { type: Number, required: true, enum: Rating },
});

export const CustomerFeedback = mongoose.model(
  "CustomerFeedback",
  customerFeedbackSchema
);
