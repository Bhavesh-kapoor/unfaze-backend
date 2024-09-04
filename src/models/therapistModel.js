import mongoose, { model, Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Education Schema
const EducationSchema = new mongoose.Schema(
  {
    highSchool: String,
    intermediate: String,
    graduation: String,
    postgraduation: String,
    additional: String,
  },
  { _id: false }
);

// Address Schema
const AddressSchema = new mongoose.Schema(
  {
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    pincode: { type: String, trim: true },
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
  },
  { _id: false }
);

// Social Schema
const SocialSchema = new mongoose.Schema(
  {
    linkedin: { type: String, trim: true },
    instagram: { type: String, trim: true },
    facebook: { type: String, trim: true },
  },
  { _id: false }
);

// Bank Details Schema
const BankSchema = new mongoose.Schema(
  {
    adharcard: String,
    pancard: String,
    bankName: String,
    ifsccode: String,
    accountHolder: String,
    accountNumber: String,
  },
  { _id: false }
);
// Therapist Schema
const TherapistSchema = new mongoose.Schema(
  {
    profileImage: {
      type: String,
      default: "",
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    is_email_verified: { type: Boolean, default: false },
    mobile: { type: String, trim: true },
    is_mobile_verified: { type: Boolean, default: false },
    gender: {
      type: String,
      trim: true,
      enum: ["male", "female", "non-binary", "other"],
    },

    role: {
      type: String,
      default: "therapist",
      trim: true,
    },
    password: { type: String, trim: true },
    refreshToken: String,
    education: EducationSchema,
    licence: { type: String, trim: true },
    specialization: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Specialization",
        required: true,
      },
    ],
    experience: { type: String, trim: true },
    passport: String,
    dob: {
      type: Date,
      required: true,
    },
    bio: { type: String, trim: true },
    address: AddressSchema,
    language: [{ type: String, trim: true }],
    social: SocialSchema,
    bankdetail: BankSchema,
    is_active: { type: Boolean, default: false },
    availability: {
      start_hour: { type: Number, min: 0, max: 23 },
      end_hour: { type: Number, min: 0, max: 23 },
    },
    USD_Price: {
      type: Number,
      default: 0,
      required: true,
    },
    INR_Price: {
      type: Number,
      default: 0,
    },
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
