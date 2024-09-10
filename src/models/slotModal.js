import mongoose, { Schema } from "mongoose";

// Define the Timeslot Schema
const timeslotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  duration: {
    type: String,
    default: "30",
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  isBooked: {
    type: Boolean,
    default: false,
  },
  bookedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
});

const slotSchema = new mongoose.Schema(
  {
    therapist_id: {
      type: Schema.Types.ObjectId,
      ref: "TherapistModel",
      required: true,
      unique: true,
    },
    timeslots: [timeslotSchema], // Embed the timeslot schema
  },
  { timestamps: true }
);

const Slot = mongoose.model("slot", slotSchema);
const TimeSlot = mongoose.model("timeSlot", timeslotSchema);

export { Slot, TimeSlot };
