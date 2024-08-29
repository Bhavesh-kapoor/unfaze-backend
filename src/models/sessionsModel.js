import mongoose, { Schema } from "mongoose";
const sessionSchema = new Schema({
  enrolled_course_id: {
    type: Schema.Types.ObjectId,
    ref: "EnrolledCourse",
    required: true,
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  therapist_id: {
    type: Schema.Types.ObjectId,
    ref: "Therapist",
    required: true,
  },
  status: {
    type: String,
    enum: ["upcomming", "completed", "cancelled"],
    default: "upcomming",
  },
  start_time: { type: Date, required: true },
  end_time: { type: Date },
},{timestamps:true});
export const Session = mongoose.model("Session", sessionSchema);
