import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { Therapist } from "../../models/therapistModel.js";
import { Transaction } from "../../models/transactionModel.js";
import { parseISO, isValid, addMinutes, format, addDays } from "date-fns";
import uniqid from "uniqid";
import Cashfree from "../../config/cashfree.config.js";
import mongoose from "mongoose";
import getExchangeRate from "../../utils/currencyConverter.js";
import { Slot } from "../../models/slotModal.js";
import { Course } from "../../models/courseModel.js";
// import axios from "axios";
import { Specialization } from "../../models/specilaizationModel.js";
import { convertTo24HourFormat } from "../../utils/convertTo24HrFormat.js";
import { Coupon } from "../../models/couponModel.js";
import axios from "axios";
// const SESSION_DURATION_MINUTES = 60;
const createOrder = asyncHandler(async (req, res) => {
  try {
    const { therapist_id, specialization_id, slot_id, coupon_code } = req.body;
    let order_currency;
    if (process.env.DEV_MODE == "dev") {
      order_currency = "INR"
    } else {
      order_currency = "USD"
    }
    const user = req.user;
    const specialization = await Specialization.findById(specialization_id);
    let amountToPay = specialization?.usdPrice;
    let discountPercent = 0;
    let fixDiscount = 0;
    console.log("coupon_code", coupon_code)
    if (coupon_code) {
      const coupon = await Coupon.findOne({ code: coupon_code });
      if (!coupon || coupon.expiryDate < new Date() || !coupon.isActive) {
        return res.status(200).json(new ApiResponse(200, "", "Coupon not found or expired"));
      }
      if (!coupon.specializationId.equals(new mongoose.Types.ObjectId(specialization_id))) {
        return res
          .status(200)
          .json(new ApiResponse(200, "", "this coupon is not valid for this category"));
      }
      if (coupon.currencyType !== "USD") {
        return res.status(200).json(new ApiResponse(200, "", "This coupon is not valid for your location"));
      }
      if (coupon.type === "percentage") {
        amountToPay = (specialization?.usdPrice) * (100 - coupon.discountPercentage) / 100;
        discountPercent = coupon.discountPercentage
      } else {
        amountToPay = (specialization?.usdPrice) - coupon.fixDiscount;
        fixDiscount = coupon.fixDiscount
      }
    }
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
    const startDateTime = new Date(`${formattedDate}T${convertTo24HourFormat(startTime)}`);
    const [start_Time, startModifier] = startTime.split(' ');
    const [end_Time, endModifier] = endTime.split(' ');
    let endDateTime = new Date(`${formattedDate}T${convertTo24HourFormat(endTime)}`);

    if (startModifier === 'PM' && endModifier === 'AM') {
      endDateTime = addDays(endDateTime, 1);
    }

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

    let transactionId;
    transactionId = uniqid();
    transactionId = `unfazed${transactionId}`;

    // book the slot first to avoid collisions

    await Slot.updateOne({
      therapist_id: new mongoose.Types.ObjectId(therapist_id),
      "timeslots._id": new mongoose.Types.ObjectId(slot_id),
    }, {
      $set: {
        "timeslots.$.isBooked": true,
      },
    })
    let request = {
      order_amount: `${amountToPay}`,
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
    // const response = await Cashfree.PGCreateOrder("2023-08-01", request);
    const response = await axios.post(
      process.env.CASHFREE_API_URL,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'x-api-version': '2023-08-01'
        },
      }
    );
    const paymentSessionId = response.data.payment_session_id;
    const order_id = response.data.order_id;
    const rate = await getExchangeRate("USD", "INR");
    let rate_USD = rate * 100;
    const initiatedTransaction = new Transaction({
      transactionId: order_id,
      user_id: user._id,
      therapist_id,
      slotId: slot_id,
      category: specialization_id,
      amount_USD: Math.round(amountToPay * 100 / 100),
      rate_USD: rate_USD,
      payment_status: "PAYMENT_INITIATED",
      start_time: startDateTime,
      end_time: endDateTime,
      discountPercent: discountPercent,
      fixDiscount: fixDiscount,
      couponCode: coupon_code,
      type: "single"
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
    console.log(error);
    console.error(
      "Error creating order:",
      error.response ? error.response.data : error.message
    );
    return res
      .status(500)
      .json(new ApiResponse(500, error, "failed to book slot"));
  }
});
const createOrderForCourse = asyncHandler(async (req, res) => {
  const { therapist_id, courseId, type = "course" } = req.body;
  const user = req.user;
  let order_currency;
  if (process.env.DEV_MODE == "dev") {
    order_currency = "INR"
  } else {
    order_currency = "USD"
  }

  if (!mongoose.Types.ObjectId.isValid(therapist_id)) {
    return res
      .status(400)
      .json(new ApiError(400, "", "Invalid therapist id!!!"));
  }

  const therapist = await Therapist.findOne({ _id: therapist_id });
  if (!therapist) {
    return res
      .status(404)
      .json(new ApiError(404, "", "Invalid therapist !!!"));
  }
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, "Course not found or invalid!")
  }
  let amountToPay = course.usdPrice;
  let discountPercent = 0;
  let fixDiscount = 0;
  if (coupon_code) {
    const coupon = await Coupon.findOne({ code: coupon_code });
    if (!coupon || coupon.expiryDate < new Date() || !coupon.isActive) {
      return res.status(200).json(new ApiResponse(200, "", "Coupon not found or expired"));
    }
    if (!coupon.specializationId.equals(new mongoose.Types.ObjectId(course.specializationId))) {
      return res
        .status(200)
        .json(new ApiResponse(200, "", "this coupon is not valid for this category"));
    }
    if (coupon.currencyType !== "USD") {
      return res.status(200).json(new ApiResponse(200, "", "This coupon is not valid at your Location!"));
    }
    if (coupon.type === "percentage") {
      amountToPay = (course.usdPrice) * (100 - coupon.discountPercentage) / 100;
      discountPercent = coupon.discountPercentage
    } else {
      amountToPay = (course.usdPrice) - coupon.fixDiscount;
      fixDiscount = coupon.fixDiscount
    }
  }
  let transactionId
  transactionId = uniqid();
  transactionId = `unfazed${transactionId}`;
  let request = {
    order_amount: `${amountToPay}`,
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
    // const response = await Cashfree.PGCreateOrder("2023-08-01", request);
    const response = await axios.post(
      process.env.CASHFREE_API_URL,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'x-api-version': '2023-08-01'
        },
      }
    );
    const paymentSessionId = response.data.payment_session_id;
    const order_id = response.data.order_id;
    const rate = await getExchangeRate("USD", "INR");
    let rate_USD = rate * 100;
    const initiatedTransaction = new Transaction({
      courseId,
      category: course.specializationId,
      type,
      transactionId: order_id,
      user_id: user._id,
      therapist_id,
      amount_USD: Math.round(amountToPay * 100 / 100),
      rate_USD: rate_USD,
      payment_status: "PAYMENT_INITIATED",
      discountPercent: discountPercent,
      fixDiscount: fixDiscount,
      couponCode: coupon_code,
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
    return res
      .status(500)
      .json(new ApiResponse(500, error, "failed to book slot"));
  }
});
const verifyPayment = asyncHandler(async (req, res, next) => {
  const { order_id } = req.params;
  if (!order_id) {
    return res
      .status(501)
      .json(new ApiError(501, "", "order_id is required"));
  }
  try {
    // Make the request to Cashfree's API with the correct version
    const response = await axios.post(
      `${process.env.CASHFREE_API_URL}/${order_id}`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'x-api-version': "2023-08-01"
        },
      }
    );
    if (response.data.order_status === "ACTIVE") {
      return res.status(200).json(new ApiResponse(200, response.data, "Order has been initiated and is still active"));
    }
    const transaction = await Transaction.findOne({ transactionId: order_id });
    req.paymentDetails = response.data;
    req.transaction = transaction;
    next();
  } catch (error) {
    console.log(error.response?.data || error);
    return res.status(500).json(new ApiError(500, "", "Something went wrong!"));
  }
});

export { createOrder, verifyPayment, createOrderForCourse };
