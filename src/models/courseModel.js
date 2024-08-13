import mongoose, { Schema } from "mongoose";
const courseSchema = new Schema(
  {
    therapist_id: {
      type: Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
    },
    session_count: {
      type: Number,
      required: true,
    },
    cost: {
      type: Number,
      required: true,
    },
    specialization_id: {
      type: Schema.Types.ObjectId,
      ref: "Specialization",
      required: true,
    },
  },
  { timestamps: true }
);
export const Course = mongoose.model("Course", courseSchema);
