import mongoose, { Schema } from "mongoose";
const courseSchema = new Schema(
  {
    session_offered: {
      type: Number,
      required: true,
    },
    usdPrice: {
      type: Number,
      required: true
    },
    inrPrice: {
      type: Number,
      required: true,
    },
    specialization_id: {
      type: Schema.Types.ObjectId,
      ref: "Specialization",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);
export const Course = mongoose.model("Course", courseSchema);
