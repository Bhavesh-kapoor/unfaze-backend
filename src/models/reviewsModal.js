import mongoose, { Schema } from "mongoose";

const Rating = [1, 2, 3, 4, 5];

const customerFeedbackSchema = new Schema({
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Therapist",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  review: { type: String, default: "" },
  isActive: { type: Boolean, default: false },
  rating: { type: Number, required: true, enum: Rating },
});

export const CustomerFeedback = mongoose.model(
  "CustomerFeedback",
  customerFeedbackSchema
);
