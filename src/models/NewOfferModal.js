import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coupon",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  sentToUsersAt: {
    type: Date,
    default: null,
  },
  notificationCount: {
    type: Number,
    default: 0,
  },
});

// Create the Offer model
const Offer = mongoose.model("Offer", offerSchema);

export default Offer;
