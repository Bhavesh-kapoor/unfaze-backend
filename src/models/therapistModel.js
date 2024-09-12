// import mongoose, { model, Schema, Types } from "mongoose";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// // Education Schema
// const EducationSchema = new mongoose.Schema(
//   {
//     highSchool: String,
//     intermediate: String,
//     graduation: String,
//     postgraduation: String,
//     additional: String,
//   },
//   { _id: false }
// );

// // Address Schema
// const AddressSchema = new mongoose.Schema(
//   {
//     state: { type: String, trim: true },
//     city: { type: String, trim: true },
//     pincode: { type: String, trim: true },
//     addressLine1: { type: String, trim: true },
//     addressLine2: { type: String, trim: true },
//   },
//   { _id: false }
// );

// // Social Schema
// const SocialSchema = new mongoose.Schema(
//   {
//     linkedin: { type: String, trim: true },
//     instagram: { type: String, trim: true },
//     facebook: { type: String, trim: true },
//   },
//   { _id: false }
// );

// // Bank Details Schema
// const BankSchema = new mongoose.Schema(
//   {
//     adharcard: String,
//     pancard: String,
//     bankName: String,
//     ifsccode: String,
//     accountHolder: String,
//     accountNumber: String,
//   },
//   { _id: false }
// );
// // Therapist Schema
// const TherapistSchema = new mongoose.Schema(
//   {
//     profileImage: {
//       type: String,
//       default: "",
//     },
//     firstName: { type: String, required: true, trim: true },
//     lastName: { type: String, required: true, trim: true },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },
//     is_email_verified: { type: Boolean, default: false },
//     mobile: { type: String, trim: true },
//     is_mobile_verified: { type: Boolean, default: false },
//     gender: {
//       type: String,
//       trim: true,
//       enum: ["male", "female", "non-binary", "other"],
//     },

//     role: {
//       type: String,
//       default: "therapist",
//       trim: true,
//     },
//     password: { type: String, trim: true },
//     refreshToken: String,
//     education: EducationSchema,
//     licence: { type: String, trim: true },
//     specialization: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Specialization",
//         required: true,
//       },
//     ],
//     adharNumber: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     panNumber: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     experience: { type: String, trim: true },
//     passport: String,
//     dateOfBirth: {
//       type: Date,
//       required: true,
//     },
//     bio: { type: String, trim: true },
//     address: AddressSchema,
//     language: [{ type: String, trim: true }],
//     social: SocialSchema,
//     bankdetail: BankSchema,
//     isActive: { type: Boolean, default: false },
//     // availability: {
//     //   start_hour: { type: Number, min: 0, max: 23 },
//     //   end_hour: { type: Number, min: 0, max: 23 },
//     // },
//     serviceChargeUsd: {
//       type: Number,
//       default: 0,
//       required: true,
//     },
//     usdPrice: {
//       type: Number,
//       default: 0,
//       required: true,
//     },
//     serviceChargeInr: {
//       type: Number,
//       default: 0,
//       required: true,
//     },
//     inrPrice: {
//       type: Number,
//       default: 0,
//     },
//   },
//   { timestamps: true }
// );

// TherapistSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

// // Method to compare password
// TherapistSchema.methods.isPasswordCorrect = async function (password) {
//   return await bcrypt.compare(password, this.password);
// };

// // Method to generate access token
// TherapistSchema.methods.generateAccessToken = function () {
//   return jwt.sign(
//     {
//       _id: this._id,
//       role: "therapist",
//       email: this.email,
//       name: `${this.firstName} ${this.lastName}`,
//     },
//     process.env.ACCESS_TOKEN_KEY,
//     { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
//   );
// };

// // Method to generate refresh token
// TherapistSchema.methods.generateRefreshToken = function () {
//   return jwt.sign(
//     { _id: this._id, role: "therapist" },
//     process.env.REFRESH_TOKEN_KEY,
//     {
//       expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
//     }
//   );
// };

// export const Therapist = mongoose.model("Therapist", TherapistSchema);

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
    highSchool: { type: educationDetailSchema, required: true },
    intermediate: { type: educationDetailSchema, required: true },
    graduation: { type: educationDetailSchema, required: false },
    postGraduation: { type: educationDetailSchema, required: false },
  },
  { _id: false }
);

const addressSchema = new Schema(
  {
    country: { type: String, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    pincode: { type: String, trim: true },
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    landmark: { type: String, trim: true },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
  },
  { _id: false }
);

// Social Schema
const socialSchema = new Schema(
  {
    linkedin: { type: String, trim: true, default: "" },
    instagram: { type: String, trim: true, default: "" },
    facebook: { type: String, trim: true, default: "" },
    twitter: { type: String, trim: true, default: "" },
    youtube: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

// Bank Details Schema
const bankSchema = new Schema(
  {
    bankName: { type: String, trim: true },
    ifscCode: { type: String, trim: true },
    accountHolder: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    branchName: { type: String, trim: true },
    accountType: { type: String, trim: true },
  },
  { _id: false }
);

// Therapist Schema
const TherapistSchema = new Schema(
  {
    mobile: { type: String, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: { type: String, default: "therapist", trim: true },
    ratings: { type: String, trim: true, default: "4.5" },
    sessionCount: { type: Number, default: "100" },
    license: { type: String, trim: true },
    password: { type: String, trim: true },
    experience: { type: String, trim: true },
    profileImageUrl: { type: String, default: "" },
    isEmailVerified: { type: Boolean, default: false },
    isMobileVerified: { type: Boolean, default: false },
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
      enum: ["male", "female", "non-binary", "other"],
      required: true,
    },
    refreshToken: { type: String },
    bankDetails: bankSchema,
    socialMedia: socialSchema,
    addressDetails: addressSchema,
    educationDetails: educationSchema,
    bio: { type: String, trim: true },
    languages: [{ type: String, trim: true }],
    dateOfBirth: { type: Date, required: true },
    adharNumber: { type: String, default: "" },
    panNumber: { type: String, default: "" },
    isActive: { type: Boolean, default: false },
    usdPrice: { type: Number, default: 0 },
    inrPrice: { type: Number, default: 0 },
    serviceChargeUsd: { type: Number, default: 0, required: true },
    serviceChargeInr: { type: Number, default: 0, required: true },

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
