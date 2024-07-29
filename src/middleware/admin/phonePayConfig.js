import axios from "axios";
import uniqid from "uniqid";
import sha256 from "sha256";
import mongoose from "mongoose";
import ApiError from "../../utils/ApiError.js";
import { Course } from "../../models/courseModel.js";
const APP_BE_URL = "http://localhost:8080";

export async function processPayment(req, res) {
  try {
    const { amount, mobile } = req.body;
    const { course_id } = req.params;
    const user_id = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(course_id)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    const course = await Course.findOne({ _id: course_id });
    if (!course) {
      return res.status(404).json(new ApiError(404, "Invalid course"));
    }

    const transactionId = uniqid();
    const PayLoad = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: user_id,
      amount: amount * 100,
      redirectUrl: `${APP_BE_URL}/payment/validate/${transactionId}`,
      redirectMode: "REDIRECT",
      mobileNumber: mobile,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    console.log("PayLoad", PayLoad);

    const bufferObj = Buffer.from(JSON.stringify(PayLoad), "utf8");
    const base64EncodedPayload = bufferObj.toString("base64");
    console.log("Base64 Encoded Payload", base64EncodedPayload);

    const stringToHash =
      base64EncodedPayload + "/pg/v1/pay" + process.env.SALT_KEY;
    const sha256_val = sha256(stringToHash).toString();
    const xVerifyChecksum = sha256_val + "###" + process.env.SALT_INDEX;
 console.log("check",process.env.PHONE_PE_HOST_URL)
    const response = await axios.post(
      `${process.env.PHONE_PE_HOST_URL}/pg/v1/pay`,
      { request: base64EncodedPayload },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerifyChecksum,
          accept: "application/json",
        },
      }
    );

    if (
      response.data &&
      response.data.data &&
      response.data.data.instrumentResponse
    ) {
      res.redirect(response.data.data.instrumentResponse.redirectInfo.url);
    } else {
      throw new Error("Invalid response from payment gateway");
    }
  } catch (error) {
    console.error("Payment processing error", error);
    res.status(500).json({ erorr: error });
  }
}
export const validatePayment = async (req, res, next) => {
  const { merchantTransactionId } = req.params;
  if (merchantTransactionId) {
    const statusUrl = `${process.env.PHONE_PE_HOST_URL}/pg/v1/status/${process.env.MERCHANT_ID}/${merchantTransactionId}`;
    const string = `/pg/v1/status/${process.env.MERCHANT_ID}/${merchantTransactionId}${process.env.SALT_KEY}`;
    const sha256_val = sha256(string);
    const xVerifyChecksum = sha256_val + "###" + process.env.SALT_INDEX;

    try {
      const response = await axios.get(statusUrl, {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerifyChecksum,
          "X-MERCHANT-ID": merchantTransactionId,
          accept: "application/json",
        },
      });

      req.paymentValidation = response.data;
      next();
    } catch (error) {
      res.status(500).send(error.message);
    }
  } else {
    res.status(400).send("Sorry!! Error");
  }
};
