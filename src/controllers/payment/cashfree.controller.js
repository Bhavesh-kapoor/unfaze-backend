import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { Therapist } from "../../models/therapistModel.js";
import { Transaction } from "../../models/transactionModel.js";
import { parseISO, isValid, addMinutes } from "date-fns";
import uniqid from "uniqid";
import Cashfree from "../../config/cashfree.config.js";
import mongoose from "mongoose";
import getExchangeRate from ""

const SESSION_DURATION_MINUTES = 30;
const createOrder = asyncHandler(async (req, res) => {
  const { therapist_id, SpecializationId, date, startTime,  } = req.body;
  const order_currency = "USD"
  const user = req.user;
  const startDateTime = parseISO(`${date}T${startTime}`);
  if (!isValid(startDateTime)) {
    console.error("Invalid date-time format:", startDateTime);
    return res
      .status(400)
      .json(new ApiError(400, "", "Invalid date or time format"));
  }
  const endDateTime = addMinutes(startDateTime, SESSION_DURATION_MINUTES);
  if (startDateTime >= endDateTime) {
    return res.status(400).send({ error: "End time must be after start time" });
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
    return res.status(404).json(new ApiError(404, "", "Invalid therapist !!!"));
  }
  let transactionId = uniqid();
  transactionId = `unfazed${transactionId}`;
  let request = {
    order_amount: `${therapist.approvedPrice}`,
    order_currency: `${order_currency}`,
    order_id: `${transactionId}`,
    customer_details: {
      customer_id: `${user._id}`,
      customer_phone: `${user.mobile}`,
    },
    order_meta: {
      return_url: `https://www.cashfree.com/devstudio/preview/pg/web/checkout?order_id=${transactionId}`,
    },
  };
  try {
    const response = await Cashfree.PGCreateOrder("2023-08-01", request);
    const paymentSessionId = response.data.payment_session_id;
    const order_id = response.data.order_id;
    rate_USD = 
    const initiatedTransaction = new Transaction({
      transactionId: order_id,
      user_id: user._id,
      therapist_id,
      category:SpecializationId,
      amount_USD: therapist.USD_Price,
      rate_USD:
      status: "PAYMENT_INITIATED",
      start_time: startDateTime,
      end_time: endDateTime,
    });

    await initiatedTransaction.save();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { paymentSessionId, order_id },
          "order Inialized successfully"
        )
      );
  } catch (error) {
    console.error(
      "Error creating order:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to create order" });
  }
});

const verifyPayment = asyncHandler(async (req, res, next) => {
  const { order_id } = req.query;
  console.log("received ", order_id);
  if (!order_id) {
    return res
      .status(501)
      .json(new ApiError(501, error, "order_id is required"));
  }
  try {
    const response = await Cashfree.PGFetchOrder("2023-08-01", order_id);
    const transaction = await Transaction.findOne({ transactionId: order_id });
    req.paymentDetails = response.data;
    req.transaction = transaction;
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json(new ApiError(500, "", "something went wrong!"));
  }
});

export { createOrder, verifyPayment };
