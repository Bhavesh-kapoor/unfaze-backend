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
    transaction_id: {
      type: String,
      required: true,
    },
    payment_status: {
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
    payment_details: {
      type: Object,
      default: {}
    },
    is_active: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

export const EnrolledCourse = mongoose.model("EnrolledCourse", enrolledCourse);
