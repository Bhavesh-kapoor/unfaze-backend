import mongoose, { Schema } from "mongoose";
const sessionSchema = new Schema(
  {
    transaction_id: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    therapist_id: {
      type: Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "completed", "cancelled","rescheduled","missed"],
      default: "upcoming",
    },
    channelName: {
      type: String,
    },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Session = mongoose.model("Session", sessionSchema);
