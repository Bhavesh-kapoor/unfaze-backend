import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const EductionSchema = {
  highSchool: {
    type: String,
  },
  intermediate: {
    type: String,
  },
  graduation: {
    type: String,
  },
  postgraduation: {
    type: String,
  },
  additional: {
    type: String,
  },
};

const AddressSchema = {
  state: {
    trim: true,
    type: String,
  },

  city: {
    type: String,
    trim: true,
  },
  pincode: {
    type: String,
    trim: true,
  },
  completeAddress: {
    type: String,
    trim: true,
  },
};

const socialSchema = {
  linkedin: {
    type: String,
    trim: true,
  },
  instagram: {
    type: String,
    trim: true,
  },
  facebook: {
    type: String,
    trim: true,
  },
};

const bankSchema = {
  adharcard: {
    type: String,
  },
  pancard: {
    type: String,
  },
  bankName: {
    type: String,
  },
  ifsccode: {
    type: String,
  },
  accountHolder: {
    type: String,
  },
  accoundNumber: {
    type: String,
  },
};

const TherepistSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      required: true,
      trim: true,
      enum: ["male", "female", "non-binary", "other"],
    },
    password: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    education: EductionSchema,
    licence: {
      type: String,
      trim: true,
    },
    specialization: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Specialization",
        required: true,
      },
    ],
    experience: {
      type: String,
      trim: true,
    },
    passport: {
      type: String,
    },
    bio: {
      type: String,
      trim: true,
    },
    address: AddressSchema,
    language: {
      type: [String],
      trim: true,
    },
    social: socialSchema,
    bankdetail: bankSchema,
    is_active: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: true }
);

TherepistSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

TherepistSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

TherepistSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_KEY,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

TherepistSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_KEY,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const Therapist = mongoose.model("Therapist", TherepistSchema);
