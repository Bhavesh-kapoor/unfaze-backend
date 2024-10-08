import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose, { Schema } from "mongoose";

// Education Detail Schema
const educationDetailSchema = new Schema(
  {
    courseName: { type: String, trim: true, Default: "" },
    institutionName: { type: String, trim: true },
    completionYear: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear(),
    },
    certificateImageUrl: { type: String, trim: true },
  },
  { _id: false }
);

const educationSchema = new Schema(
  {
    highSchool: { type: educationDetailSchema },
    graduation: { type: educationDetailSchema },
    intermediate: { type: educationDetailSchema },
    postGraduation: { type: educationDetailSchema },
  },
  { _id: false }
);
const addressSchema = new Schema(
  {
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    country: { type: String, trim: true },
    landmark: { type: String, trim: true },
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
  },
  { _id: false }
);

// Social Schema
const socialSchema = new Schema(
  {
    twitter: { type: String, trim: true, default: "" },
    youtube: { type: String, trim: true, default: "" },
    linkedin: { type: String, trim: true, default: "" },
    facebook: { type: String, trim: true, default: "" },
    instagram: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

// Bank Details Schema
const bankSchema = new Schema(
  {
    bankName: { type: String, trim: true },
    ifscCode: { type: String, trim: true },
    branchName: { type: String, trim: true },
    accountType: { type: String, trim: true },
    accountHolder: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
  },
  { _id: false }
);

// Therapist Schema
const TherapistSchema = new Schema(
  {
    sessionCount: { type: Number },
    mobile: { type: String, trim: true },
    license: { type: String, trim: true },
    password: { type: String, trim: true },
    experience: { type: String, trim: true },
    profileImageUrl: { type: String, default: "" },
    isEmailVerified: { type: Boolean, default: false },
    isMobileVerified: { type: Boolean, default: false },
    ratings: { type: String, trim: true, default: "4.5" },
    lastName: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    role: { type: String, default: "therapist", trim: true },
    email: {
      type: String,
      trim: true,
      unique: true,
      required: true,
      lowercase: true,
    },
    gender: {
      type: String,
      trim: true,
      required: true,
      enum: ["male", "female", "non-binary", "other"],
    },
    bankDetails: bankSchema,
    socialMedia: socialSchema,
    addressDetails: addressSchema,
    refreshToken: { type: String },
    educationDetails: educationSchema,
    bio: { type: String, trim: true },
    panNumber: { type: String, default: "" },
    usdPrice: { type: Number, default: 20 },
    inrPrice: { type: Number, default: 1200 },
    languages: [{ type: String, trim: true }],
    adharNumber: { type: String, default: "" },
    dateOfBirth: { type: Date, required: true },
    isActive: { type: Boolean, default: false },
    serviceChargeUsd: { type: Number, default: 0 },
    serviceChargeInr: { type: Number, default: 0 },
    specialization: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Specialization",
      },
    ],
  },
  { timestamps: true }
);

TherapistSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
TherapistSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Method to generate access token
TherapistSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      role: "therapist",
      email: this.email,
      name: `${this.firstName} ${this.lastName}`,
    },
    process.env.ACCESS_TOKEN_KEY,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

// Method to generate refresh token
TherapistSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id, role: "therapist" },
    process.env.REFRESH_TOKEN_KEY,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const Therapist = mongoose.model("Therapist", TherapistSchema);
