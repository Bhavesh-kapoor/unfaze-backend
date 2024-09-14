import mongoose, { Schema } from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    session_id: {
      type: Schema.Types.ObjectId,
      ref: "Session",
    },
    star: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Feedback = mongoose.model("feeback", feedbackSchema);

export default Feedback;
