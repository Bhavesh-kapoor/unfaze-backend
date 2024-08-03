
import { OTP } from "../models/otpModel.js";

async function verifyOTP(email, otp) {
  const otpDoc = await OTP.findOne({ email, otp });

  if (otpDoc) {
    await OTP.deleteOne({ _id: otpDoc._id }); // Remove the OTP after verification
    return true;
  }

  return false;
}

export { verifyOTP };
