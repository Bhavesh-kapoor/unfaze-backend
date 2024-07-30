import axios from "axios";
import uniqid from "uniqid";
import sha256 from "sha256";
import mongoose from "mongoose";
import ApiError from "../../utils/ApiError.js";
import { Course } from "../../models/courseModel.js";
const APP_BE_URL = "http://localhost:8080";

export async function processPayment(req, res) {
  try {
    const PHONE_PE_HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
    const SALT_INDEX = 1;
    const SALT_KEY = "96434309-7796-489d-8924-ab56988a6076";
    const APP_BE_URL = "http://localhost:8080"; // our application

    //-------------------------------------------------------------------------
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
    const normalPayLoad = {
      merchantId: process.env.MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: user_id,
      amount: amount * 100,
      redirectUrl: `${APP_BE_URL}/api/v1/user/payment/validate/${transactionId}`,
      redirectMode: "REDIRECT",
      mobileNumber: mobile,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };
    console.log("normalPayLoad", normalPayLoad);
    let bufferObj = Buffer.from(JSON.stringify(normalPayLoad), "utf8");
    let base64EncodedPayload = bufferObj.toString("base64");
    console.log("dta------------------", base64EncodedPayload);

    let string = base64EncodedPayload + "/pg/v1/pay" + process.env.SALT_KEY;
    let sha256_val = sha256(string);
    let xVerifyChecksum = sha256_val + "###" + process.env.SALT_INDEX;

    console.log("xvarify check ", xVerifyChecksum);
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
  // const { merchantTransactionId } = req.params;
  // if (merchantTransactionId) {
  //   const statusUrl = `${process.env.HOST_URL}/pg/v1/status/${process.env.MERCHANT_ID}/${merchantTransactionId}`;
  //   const string = `/pg/v1/status/${process.env.MERCHANT_ID}/${merchantTransactionId}${process.env.SALT_KEY}`;
  //   const sha256_val = sha256(string);
  //   const xVerifyChecksum = sha256_val + "###" + process.env.SALT_INDEX;

  //   try {
  //     const response = await axios.get(statusUrl, {
  //       headers: {
  //         "Content-Type": "application/json",
  //         "X-VERIFY": xVerifyChecksum,
  //         "X-MERCHANT-ID": merchantTransactionId,
  //         accept: "application/json",
  //       },
  //     });
  //     req.paymentValidation = response.data;

  //     next();
  //   } catch (error) {
  //     res.status(500).send(error.message);
  //   }
  // } else {
  //   res.status(400).send("Sorry!! Error");
  // }

  const { merchantTransactionId } = req.params;

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
      .then(function (response) {
        console.log("response->", response.data);
        if (response.data && response.data.code === "PAYMENT_SUCCESS") {
          // redirect to FE payment success status page
          res.send(response.data);
        } else {
          // redirect to FE payment failure / pending status page
          res.send(response.data);
        }
      })
      .catch(function (error) {
        // redirect to FE payment failure / pending status page
        res.send(error);
      });
  } else {
    res.send("Sorry!! Error");
  }
};
