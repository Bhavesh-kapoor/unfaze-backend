import axios from "axios";
import uniqid from "uniqid";
import sha256 from "sha256";
import mongoose from "mongoose";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { Therapist } from "../../models/therapistModel.js";
import { Transaction } from "../../models/transactionModel.js";
import { parseISO, isValid, addMinutes, format } from "date-fns";
// import { Course } from "../../models/courseModel.js";
// import { EnrolledCourse } from "../../models/enrolledCourse.model.js";
const SESSION_DURATION_MINUTES = 30;
export async function processPayment(req, res) {
  try {
    const { therapist_id, specialization_id, date, time } = req.body;
    const formattedDate = format(date, "yyyy-MM-dd");
    console.log(formattedDate);
    const user = req.user;
    const startDateTime = new Date(`${formattedDate}T${time}`);
    console.log(startDateTime);
    if (!isValid(startDateTime)) {
      console.error("Invalid date-time format:", startDateTime);
      return res
        .status(400)
        .json(new ApiError(400, "", "Invalid date or time format"));
    }
    const endDateTime = addMinutes(startDateTime, SESSION_DURATION_MINUTES);
    if (startDateTime >= endDateTime) {
      return res
        .status(400)
        .send({ error: "End time must be after start time" });
    }
    // Validate therapist_id
    if (!mongoose.Types.ObjectId.isValid(therapist_id)) {
      return res
        .status(400)
        .json(new ApiError(400, "", "Invalid therapist id!!!"));
    }

    // Find therapist
    const therapist = await Therapist.findOne({ _id: therapist_id });
    console.log(therapist);
    if (!therapist) {
      return res
        .status(404)
        .json(new ApiError(404, "", "Invalid therapist !!!"));
    }
    let transactionId = uniqid();
    transactionId = `unfazed${transactionId}`;
    const normalPayLoad = {
      merchantId: process.env.MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: `MUID_${user._id}`,
      amount: therapist.inrPrice * 100,
      redirectUrl: `${process.env.FRONTEND_URL}/verifying_payment/${transactionId}`,
      redirectMode: "REDIRECT",
      mobileNumber: user.mobile,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
      payMode: "PAY_PAGE",
    };

    const bufferObj = Buffer.from(JSON.stringify(normalPayLoad), "utf8");
    const base64EncodedPayload = bufferObj.toString("base64");
    const string = base64EncodedPayload + "/pg/v1/pay" + process.env.SALT_KEY;
    const sha256_val = sha256(string);
    const xVerifyChecksum = sha256_val + "###" + process.env.SALT_INDEX;

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

    try {
      const response = await axios.request(options);
      console.log("response->", response.data);
      console.log(
        "redirect",
        response.data.data.instrumentResponse.redirectInfo.url
      );
      const initiatedTransaction = new Transaction({
        transactionId,
        user_id: user._id,
        therapist_id,
        category: specialization_id,
        amount_INR: therapist.inrPrice,
        status: "PAYMENT_INITIATED",
        start_time: startDateTime,
        end_time: endDateTime,
      });

      await initiatedTransaction.save();
      res.status(200).json(
        new ApiResponse(200, {
          redirect_url: response.data.data.instrumentResponse.redirectInfo.url,
        })
      );
    } catch (error) {
      console.error("Payment request error:", error);
      return res
        .status(500)
        .json(new ApiError(500, "", "Payment initialization failed"));
    }
  } catch (error) {
    console.log("error in payment initialization", error);
    return res
      .status(500)
      .json(
        new ApiError(500, "", "An error occurred during payment processing")
      );
  }
}
export const validatePayment = async (req, res, next) => {
  const { merchantTransactionId } = req.params;
  if (!merchantTransactionId) {
    return res
      .status()
      .send(new ApiError(400, "", "merchantTransactionId is required"));
  }
  let statusUrl =
    `${process.env.HOST_URL}/pg/v1/status/${process.env.MERCHANT_ID}/` +
    merchantTransactionId;

  let string =
    `/pg/v1/status/${process.env.MERCHANT_ID}/` +
    merchantTransactionId +
    process.env.SALT_KEY;
  let sha256_val = sha256(string);
  let xVerifyChecksum = sha256_val + "###" + process.env.SALT_INDEX;
  try {
    const response = await axios.get(statusUrl, {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerifyChecksum,
        "X-MERCHANT-ID": merchantTransactionId,
        accept: "application/json",
      },
    });
    const transaction = await Transaction.findOne({
      transactionId: merchantTransactionId,
    });
    req.paymentDetails = response.data;
    req.transaction = transaction;
    next();
  } catch (error) {
    console.log("Error while validating the payment", error);
    res.status(500).json({ "Error while validating the payment": error });
  }
};
