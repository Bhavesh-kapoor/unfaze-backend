import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


const userSchema = new Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization'
    },
    mobile: { type: String },
    password: { type: String },
    googleId: { type: String },
    facebookId: { type: String },
    refreshToken: { type: String },
    isActive: { type: Boolean, default: true },
    profileImage: { type: String, default: "" },
    isEmailVerified: { type: Boolean, default: false },
    isMobileVerified: { type: Boolean, default: false },
    lastName: { type: String, required: true, trim: true },
    country: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    firstName: { type: String, required: true, trim: true },
    permissions: { type: [String], default: [] },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    gender: {
      type: String,
      trim: true,
      enum: ["male", "female", "non-binary", "other"],
    },
    dateOfBirth: {
      type: Date,
      // validate: {
      //   validator: (value) => value < new Date(),
      //   message: "Date of birth must be in the past.",
      // },
    },
    role: {
      type: String,
      enum: ["user", "admin", "corp-user", "corp-admin"],
      default: "user",
      trim: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  if (!this.password || this.password === "") {
    const existingUser = await User.findById(this._id).select('password');
    if (existingUser) {
      this.password = existingUser.password;
    }
  } else {
    // Hash the password if it's not empty
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      role: this.role,
      email: this.email,
      lastName: this.lastName,
      firstName: this.firstName,
    },
    process.env.ACCESS_TOKEN_KEY,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      role: this.role,
    },
    process.env.REFRESH_TOKEN_KEY,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export const User = mongoose.model("User", userSchema);
