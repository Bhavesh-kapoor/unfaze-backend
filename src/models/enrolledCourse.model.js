import mongoose, { Schema } from "mongoose";

const enrolledCourse = new Schema(
  {
    course_id: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    payment_status: {
      type: String,
      required: true,
    },
    merchantTransactionId: {
      type: String,
      required: true,
      unique: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    transaction_id: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
      required: true,
    },
    remaining_sessions: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    statusCode: {
      type: String,
      required: true,
    },
    paymentMode: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const EnrolledCourse = mongoose.model("EnrolledCourse", enrolledCourse);
