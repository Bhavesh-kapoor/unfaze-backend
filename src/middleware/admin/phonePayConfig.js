import axios from "axios";
import uniqid from "uniqid";
import sha256 from "sha256";
import mongoose from "mongoose";
import ApiError from "../../utils/ApiError.js";
import { Course } from "../../models/courseModel.js";
import { EnrolledCourse } from "../../models/enrolledCourse.model.js";
const APP_BE_URL = "http://localhost:8080";

export async function processPayment(req, res) {
  try {
    const { amount, mobile } = req.body;
    const { course_id } = req.params;
    const user_id = req.user?._id;
    if (!mongoose.Types.ObjectId.isValid(course_id)) {
      return res.status(400).json(new ApiError(404, "", "Invalid course id!!!"));
    }
    const course = await Course.findOne({ _id: course_id });
    if (!course) {
      return res.status(404).json(new ApiError(404, "", "Invalid course !!!"));
    }
    if (amount !== course.cost) {
      return res.status(403).json(new ApiError(403, "", "invalid amount!!!"));
    }
    const alreadyEnrolled = await EnrolledCourse.findOne({
      course_id: course_id,
      user_id: user_id,
    });
    if (alreadyEnrolled) {
      return res.status(403).json(new ApiError(403, "", "already enrolled"));
    }
    const transactionId = uniqid();
    const normalPayLoad = {
      merchantId: process.env.MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: user_id,
      amount: amount * 100,
      redirectUrl: `${APP_BE_URL}/api/v1/user/validate/${transactionId}/${course_id}`,
      redirectMode: "REDIRECT",
      mobileNumber: mobile,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
      payMode: "PAY_PAGE",
    };
    let bufferObj = Buffer.from(JSON.stringify(normalPayLoad), "utf8");
    let base64EncodedPayload = bufferObj.toString("base64");
    let string = base64EncodedPayload + "/pg/v1/pay" + process.env.SALT_KEY;
    let sha256_val = sha256(string);
    let xVerifyChecksum = sha256_val + "###" + process.env.SALT_INDEX;
    const options = {
      method: "post",
      url: "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerifyChecksum,
        accept: "application/json",
      },
      data: {
        request: base64EncodedPayload,
      },
    };
    axios
      .request(options)
      .then((response) => {
        console.log("response->", response.data);
        console.log(
          "redirect",
          response.data.data.instrumentResponse.redirectInfo.url
        );
        res.redirect(response.data.data.instrumentResponse.redirectInfo.url);
      })
      .catch((error) => {
        console.error("error", error);
      });
  } catch (error) {
    console.log("erorr in payment initialization", error);
  }
}

export const validatePayment = async (req, res, next) => {
  const { merchantTransactionId, course_id } = req.params;
  console.log("checkk", merchantTransactionId, course_id);
  if (merchantTransactionId) {
    let statusUrl =
      `${process.env.HOST_URL}/pg/v1/status/${process.env.MERCHANT_ID}/` +
      merchantTransactionId;

    let string =
      `/pg/v1/status/${process.env.MERCHANT_ID}/` +
      merchantTransactionId +
      process.env.SALT_KEY;
    let sha256_val = sha256(string);
    let xVerifyChecksum = sha256_val + "###" + process.env.SALT_INDEX;

    axios
      .get(statusUrl, {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerifyChecksum,
          "X-MERCHANT-ID": merchantTransactionId,
          accept: "application/json",
        },
      })
      .then((res) => {
        req.course_id = course_id;
        req.paymentDetails = res.data;
        console.log("response", res);
        next();
      })
      .catch((error) => {
        console.log("Error while validating the payment", error);
        res.status(500).json({ "Error while validating the payment": error });
      });
  } else {
    res.send("Sorry!! Error");
  }
};
