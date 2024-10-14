import mongoose, { Schema } from "mongoose";
const courseSchema = new Schema(
  { 
    sessionOffered: {
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
    specializationId: {
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
