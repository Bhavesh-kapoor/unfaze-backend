import dotenv from "dotenv";
import otpGenerator from "otp-generator";
import { OTP } from "../models/otpModel.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/userModel.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { otpContent } from "../static/emailcontent.js";
import { Therapist } from "../models/therapistModel.js";
import { sendOtpMessage } from "../config/msg91.config.js";
import { transporter, mailOptions } from "../config/nodeMailer.js";

dotenv.config();
async function verifyOTP(email, otp) {
  const otpDoc = await OTP.findOne({ email, otp });
  if (otpDoc) {
    await OTP.deleteOne({ _id: otpDoc._id });
    return true;
  }
  return false;
}
async function verifyMobileOTP(mobile, otp) {
  const otpDoc = await OTP.findOne({ mobile, otp });
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
const createAndStoreMobileOTP = async (mobile) => {
  const otp = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const otpDoc = new OTP({ mobile, otp });
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
  if (process.env.NODE_ENV === "dev") console.log(otp);
  const htmlContent = otpContent(otp);
  const options = mailOptions(
    email,
    "Email verification code - Unfazed",
    htmlContent
  );
  try {
    transporter.sendMail(options, (error, info) => {
      if (error) {
        console.log(error);
      }
      console.log("Otp sent: %s", info.messageId);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            info.messageId,
            "otp has been send successfully please check your Email!"
          )
        );
    });
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiError(500, "", "something went wrong while sending the otp!")
      );
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
    user.isEmailVerified = true;
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
    user.isEmailVerified = true;
    await user.save();
    res
      .status(200)
      .json(new ApiResponse(200, null, "Email verification success!"));
  } else {
    res.status(400).json(new ApiError(400, null, "invalid otp"));
  }
};
const sendMobileOtp = asyncHandler(async (req, res) => {
  try {
    const { mobile } = req.body;
    const otp = await createAndStoreMobileOTP(mobile);
    const result = await sendOtpMessage(mobile, otp);
    console.log(result);
    return res.status(200).json(new ApiResponse(200, result));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error, "Error sending OTP"));
  }
});
const mobileVerify = async (req, res) => {
  const user = req.user;
  const { mobile, otp } = req.body;
  if (!mobile || !otp) {
    return res
      .status(500)
      .json(new ApiError(500, "", "email and otp are required!"));
  }
  const isValid = await verifyMobileOTP(mobile, otp);
  if (isValid) {
    user.isMobileVerified = true;
    user.mobile = mobile;
    const updatedUser = await user.save();

    // if (user?.role === "therapist") {
    //   const user = await Therapist.findOne({ email: email });
    //   user.isEmailVerified = true;
    //   await user.save();
    // } else {
    //   const user = await User.findOne({ email: email });
    //   user.isEmailVerified = true;
    //   await user.save();
    // }
    res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "mobile verification success!"));
  } else {
    res.status(400).json(new ApiError(400, null, "invalid otp"));
  }
};
// const gmailSend = asyncHandler(async (req, res) => {
//   const { name, email, message } = req.body;
//   const htmlContent = contactUsContent(name, email, message);
//   const options = mailOptions(email, "Query raised from unfazed", htmlContent);
//   // const sendMail=async()=>{
//   //   const mail = await transporter.sendMail(mailOptions)
//   //   console.log("mailsend",mail)
//   //   res.status(200).json(new ApiResponse(200,mail,"mail send success"))
//   // }
//   // sendMail().catch(console.error)
//   transporter.sendMail(options, (error, info) => {
//     if (error) {
//       console.log(error);
//       return res
//         .status(500)
//         .json(new ApiError(500, "", "Failed to send email!"));
//     }
//     console.log("Message sent: %s", info);
//     res
//       .status(200)
//       .json(new ApiResponse(200, info, "message sent successfully!"));
//   });
// });
export {
  sendOtp,
  userEmailVerify,
  therapistEmailVerify,
  verifyOTP,
  mobileVerify,
  sendMobileOtp,
  createAndStoreOTP,
  createAndStoreMobileOTP,
};
