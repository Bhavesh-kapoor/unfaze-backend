import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import otpGenerator from "otp-generator";
import { OTP } from "../models/otpModel.js";
import { Resend } from "resend";
import { User } from "../models/userModel.js";
import { Therapist } from "../models/therapistModel.js";
import dotenv from "dotenv";
import { response } from "express";
dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;

// resend config
const resend = new Resend(RESEND_API_KEY);

async function verifyOTP(email, otp) {
  const otpDoc = await OTP.findOne({ email, otp });
  if (otpDoc) {
    await OTP.deleteOne({ _id: otpDoc._id });
    return true;
  }

  return false;
}

const createAndStoreOTP = async (email) => {
  const otp = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const otpDoc = new OTP({ email, otp });
  if (!otpDoc) {
    return res
      .status(500)
      .json(new ApiError(500, "", "failed to generate otp"));
  }
  await otpDoc.save();
  return otp;
};

const sendOtp = async (req, res) => {
  const { email } = req.body;
  const otp = await createAndStoreOTP(email);
  const htmlContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2 style="color: #333;">Hello,</h2>
              <p>Thank you for using Unfaze. Your OTP code is:</p>
              <h1 style="color: #007bff;">${otp}</h1>
              <p>This OTP code is valid for 5 minutes. Please do not share this code with anyone.</p>
              <p>If you did not request this OTP, please ignore this email.</p>
              <br>
              <p>Best regards,</p>
              <p>The Unfaze Team</p>
          </div>
      `;

  try {
    const data = await resend.emails.send({
      from: "Unfaze <onboarding@resend.dev>",
      to: email,
      subject: " Email verification code - Unfaze",
      html: htmlContent,
    });
    if (!data) {
      return res
        .status(500)
        .json(new ApiError(500, "", "something went wrong in sending otp"));
    }
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          null,
          "Otp sent successfully! please check your email."
        )
      );
  } catch (error) {
    res.status(400).json(new ApiError(500, "", "something went wrong"));
  }
};
const sendMail = async (req, res) => {
  const {name, email,message } = req.body;
  const htmlContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2 style="color: #333;">Hello, admin</h2>
              <h1 style="color: #007bff;">${name}</h1>
              <p>Email of the user is ${email}</p>
              <p>message:</p>
              <p>${message}</p>
              <br>
              <p>Best regards,</p>
              <p>The Unfaze Team</p>
          </div>
      `;

  try {
    const data = await resend.emails.send({
      from: "Unfaze <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL,
      subject: "Mail from Unfaze Contact us",
      html: htmlContent,
    });
    if (!data) {
      return res
        .status(500)
        .json(new ApiError(500, "", "something went wrong in sending mail"));
    }
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          null,
          "we got your mail, we will reach you shortly!"
        )
      );
  } catch (error) {
    res.status(400).json(new ApiError(500, "", "something went wrong"));
  }
};

// user email verify
const userEmailVerify = async (req, res) => {
  const { email, otp } = req.body;

  const isValid = await verifyOTP(email, otp);

  if (isValid) {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(404)
        .json(new ApiError(404, "", "user doesn't exists!"));
    }
    user.is_email_verified = true;
    await user.save();
    res
      .status(200)
      .json(new ApiResponse(200, null, "Email verification success!"));
  } else {
    res.status(400).json(new ApiError(400, null, "invalid otp"));
  }
};

// user email verify
const therapistEmailVerify = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res
      .status(500)
      .json(new ApiError(500, "", "email and otp are required!"));
  }
  const isValid = await verifyOTP(email, otp);

  if (isValid) {
    const user = await Therapist.findOne({ email: email });
    user.is_email_verified = true;
    await user.save();
    res
      .status(200)
      .json(new ApiResponse(200, null, "Email verification success!"));
  } else {
    res.status(400).json(new ApiError(400, null, "invalid otp"));
  }
};
export { sendOtp, userEmailVerify, therapistEmailVerify,sendMail };
