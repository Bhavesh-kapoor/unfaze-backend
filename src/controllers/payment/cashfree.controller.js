import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { Therapist } from "../../models/therapistModel.js";
import { Transaction } from "../../models/transactionModel.js";
import { parseISO, isValid, addMinutes, format } from "date-fns";
import uniqid from "uniqid";
import Cashfree from "../../config/cashfree.config.js";
import mongoose from "mongoose";
import getExchangeRate from "../../utils/currencyConverter.js";
import { Slot } from "../../models/slotModal.js";
import axios from "axios";
function convertTo24HourFormat(time12h) {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours, 10);
  if (modifier === 'AM' && hours === 12) {
    hours = 0;
  } 
  if (modifier === 'PM' && hours !== 12) {
    hours += 12;
  }
  const hours24 = hours.toString().padStart(2, '0');
  const minutes24 = minutes.padStart(2, '0');

  return `${hours24}:${minutes24}`;
}

const SESSION_DURATION_MINUTES = 30;
const createOrder = asyncHandler(async (req, res) => {
  const { therapist_id, specialization_id, slot_id } = req.body;
  const order_currency = "INR";
  const user = req.user;
  const timeSlots = await Slot.aggregate([
    {
      $match: {
        therapist_id: new mongoose.Types.ObjectId(therapist_id),
      },
    },
    {
      $unwind: "$timeslots",
    },
    {
      $match: {
        "timeslots._id": new mongoose.Types.ObjectId(slot_id), 
        "timeslots.isBooked": false,
      },
    },
    {
      $project: {
        _id: "$timeslots._id",
        therapist_id: 1,
        date: "$timeslots.date",
        startTime: "$timeslots.startTime",
        endTime: "$timeslots.endTime",
        isBooked: "$timeslots.isBooked",
      },
    },
  ]);
  // console.log(timeSlots)
  if (timeSlots.length === 0) {
    return res.status(404).json(new ApiError(404, "", "Timeslot not found or already booked"));
  }
  const { date, startTime, endTime } = timeSlots[0];
  const formattedDate = format(new Date(date), "yyyy-MM-dd");
  // console.log(formattedDate);
  // console.log(convertTo24HourFormat(startTime))
  const startDateTime = new Date(`${formattedDate}T${convertTo24HourFormat(startTime)}`);
  const endDateTime = new Date(`${formattedDate}T${convertTo24HourFormat(endTime)}`);

  if (!isValid(startDateTime) || !isValid(endDateTime)) {
    console.error("Invalid date-time format:", startDateTime, endDateTime);
    return res.status(400).json(new ApiError(400, "", "Invalid date or time format"));
  }

  if (startDateTime >= endDateTime) {
    return res.status(400).send({ error: "End time must be after start time" });
  }

  if (!mongoose.Types.ObjectId.isValid(therapist_id)) {
    return res
      .status(400)
      .json(new ApiError(400, "", "Invalid therapist id!!!"));
  }

  const therapist = await Therapist.findOne({ _id: therapist_id });
  // console.log(therapist);
  if (!therapist) {
    return res
      .status(404)
      .json(new ApiError(404, "", "Invalid therapist !!!"));
  }
  let transactionId = uniqid();
  transactionId = `unfazed${transactionId}`;
  let request = {
    order_amount: `${therapist.usdPrice}`,
    order_currency: `${order_currency}`,
    order_id: `${transactionId}`,
    customer_details: {
      customer_id: `${user._id}`,
      customer_phone: `${user.mobile}`,
    },
    order_meta: {
      return_url: `${process.env.FRONTEND_URL}/verifying_payment/${transactionId}`,
    },
  };
  try {
    const response = await Cashfree.PGCreateOrder("2023-08-01", request);
    const paymentSessionId = response.data.payment_session_id;
    const order_id = response.data.order_id;
    const rate = await getExchangeRate("USD", "INR");
    let rate_USD = rate * 100;
    const initiatedTransaction = new Transaction({
      transactionId: order_id,
      user_id: user._id,
      therapist_id,
      slotId:slot_id,
      category: specialization_id,
      amount_USD: therapist.usdPrice,
      rate_USD: rate_USD,
      payment_status: "PAYMENT_INITIATED",
      start_time: startDateTime,
      end_time: endDateTime,
    });
    await initiatedTransaction.save();
    // const response = await axios.post(
    //   'https://api.cashfree.com/pg/orders',
    //   request,
    //   {
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'x-client-id': process.env.CASHFREE_APP_ID,
    //       'x-client-secret': process.env.CASHFREE_SECRET_KEY,
    //       'x-api-version': '2023-08-01'
    //     },
    //   }
    // );
    await Slot.updateOne({
      therapist_id: new mongoose.Types.ObjectId(therapist_id),
      "timeslots._id": new mongoose.Types.ObjectId(slot_id),
    },{
      $set: {
        "timeslots.$.isBooked": true,
      },
    })
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
    return res
      .status(500)
      .json(new ApiResponse(500, error, "failed to book slot"));
  }
});

const verifyPayment = asyncHandler(async (req, res, next) => {
  const { order_id } = req.query;
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
