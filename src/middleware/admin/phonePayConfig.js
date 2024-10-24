import axios from "axios";
import uniqid from "uniqid";
import sha256 from "sha256";
import mongoose from "mongoose";
import ApiError from "../../utils/ApiError.js";
import { Slot } from "../../models/slotModal.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { Therapist } from "../../models/therapistModel.js";
import { Transaction } from "../../models/transactionModel.js";
import {
  parseISO,
  isValid,
  addMinutes,
  format,
  addDays,
  subMinutes,
} from "date-fns";
import { Course } from "../../models/courseModel.js";
import dotenv from "dotenv";
import asyncHandler from "../../utils/asyncHandler.js";
import { Coupon } from "../../models/couponModel.js";
dotenv.config();
import { convertTo24HourFormat } from "../../utils/convertTo24HrFormat.js";
import { Specialization } from "../../models/specilaizationModel.js";
// import { Course } from "../../models/courseModel.js";
// import { EnrolledCourse } from "../../models/enrolledCourse.model.js";

export async function processPayment(req, res) {
  try {
    const user = req.user;

    const { therapist_id, specialization_id, slot_id, coupon_code } = req.body;
    const specialization = await Specialization.findById(specialization_id);
    if (!specialization) {
      return res
        .status(200)
        .json(new ApiResponse(200, "", "Specialization not found"));
    }
    //  const monetization = await TherapistPay.findOne({
    //   $and: [
    //     { therapistId: therapist_id },
    //     { specializationId: specialization_id }
    //   ]
    // });

    let amountToPay = specialization?.inrPrice * 100;
    let discountPercent = 0;
    let fixDiscount = 0;
    if (coupon_code) {
      const coupon = await Coupon.findOne({ code: coupon_code });
      if (!coupon || coupon.expiryDate < new Date() || !coupon.isActive) {
        return res
          .status(200)
          .json(new ApiResponse(200, "", "Coupon not found or expired"));
      }
      if (
        !coupon.specializationId.equals(
          new mongoose.Types.ObjectId(specialization_id)
        )
      ) {
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              "",
              "this coupon is not valid for this category"
            )
          );
      }
      if (coupon.currencyType !== "INR") {
        return res
          .status(200)
          .json(new ApiResponse(200, "", "This coupon is not valid in india"));
      }
      if (coupon.type === "percentage") {
        amountToPay =
          (specialization?.inrPrice * 100 * (100 - coupon.discountPercentage)) /
          100;
        discountPercent = coupon.discountPercentage;
      } else {
        amountToPay = specialization?.inrPrice * 100 - coupon.fixDiscount * 100;
        fixDiscount = coupon.fixDiscount;
      }
    }

    const createdAt = new Date(); // or your specific transaction createdAt time
    const lowerBoundTime = subMinutes(createdAt, 4.5); // 4.5 minutes earlier
    const upperBoundTime = addMinutes(createdAt, 4.5); // 4.5 minutes later

    let existingTransaction = await Transaction.find({
      slotId: slot_id,
      user_id: user._id,
      method: "phonepay",
      therapist_id: therapist_id,
      category: specialization_id,
      payment_status: "PAYMENT_INITIATED",
      createdAt: {
        $gte: lowerBoundTime, // Greater than or equal to the lower bound
        $lte: upperBoundTime, // Less than or equal to the upper bound
      },
    });

    let pipeline = [
      {
        $match: {
          therapist_id: new mongoose.Types.ObjectId(therapist_id),
        },
      },
      { $unwind: "$timeslots" },
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
    ];
    let pipelineSlot = [
      { $match: { therapist_id: new mongoose.Types.ObjectId(therapist_id) } },
      { $unwind: "$timeslots" },
      { $match: { "timeslots._id": new mongoose.Types.ObjectId(slot_id) } },
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
    ];
    let timeSlots = [];
    if (existingTransaction && existingTransaction.length > 0)
      timeSlots = await Slot.aggregate(pipelineSlot);
    else timeSlots = await Slot.aggregate(pipeline);

    if (timeSlots.length === 0) {
      return res
        .status(404)
        .json(new ApiError(404, "", "Timeslot not found or already booked"));
    }
    const { date, startTime, endTime } = timeSlots[0];
    const formattedDate = format(new Date(date), "yyyy-MM-dd");
    const startDateTime = new Date(
      `${formattedDate}T${convertTo24HourFormat(startTime)}`
    );
    const [start_Time, startModifier] = startTime.split(" ");
    const [end_Time, endModifier] = endTime.split(" ");
    let endDateTime = new Date(
      `${formattedDate}T${convertTo24HourFormat(endTime)}`
    );

    if (startModifier === "PM" && endModifier === "AM") {
      endDateTime = addDays(endDateTime, 1);
    }
    if (!isValid(startDateTime) || !isValid(endDateTime)) {
      console.error("Invalid date-time format:", startDateTime, endDateTime);
      return res
        .status(400)
        .json(new ApiError(400, "", "Invalid date or time format"));
    }
    if (startDateTime >= endDateTime) {
      return res
        .status(400)
        .send({ error: "End time must be after start time" });
    }

    if (!mongoose.Types.ObjectId.isValid(therapist_id)) {
      return res
        .status(400)
        .json(new ApiError(400, "", "Invalid therapist id!!!"));
    }

    // Find therapist
    const therapist = await Therapist.findOne({ _id: therapist_id });
    if (!therapist) {
      return res
        .status(404)
        .json(new ApiError(404, "", "Invalid therapist !!!"));
    }

    let transactionId = `unfazed${uniqid()}`;

    const normalPayLoad = {
      merchantId: process.env.MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: `MUID_${user._id}`,
      amount: amountToPay,
      redirectUrl: `${process.env.FRONTEND_URL}/verifying_payment/${transactionId}`,
      callbackUrl: `${process.env.BACKEND_URL}/api/payment/callback/${transactionId}`,
      redirectMode: "REDIRECT",
      mobileNumber: user.mobile,
      paymentInstrument: { type: "PAY_PAGE" },
      payMode: "PAY_PAGE",
    };
    const bufferObj = Buffer.from(JSON.stringify(normalPayLoad), "utf8");
    const base64EncodedPayload = bufferObj.toString("base64");
    const string = base64EncodedPayload + "/pg/v1/pay" + process.env.SALT_KEY;
    const sha256_val = sha256(string);
    const xVerifyChecksum = sha256_val + "###" + process.env.SALT_INDEX;

    const options = {
      method: "post",
      url: `${process.env.HOST_URL}/pg/v1/pay`,
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
      if (existingTransaction && existingTransaction.length > 0) {
        console.log("Updating Existing transaction...");
        existingTransaction = existingTransaction[0];
        existingTransaction.slotId = slot_id;
        existingTransaction.end_time = endDateTime;
        existingTransaction.couponCode = coupon_code;
        existingTransaction.fixDiscount = fixDiscount;
        existingTransaction.start_time = startDateTime;
        existingTransaction.category = specialization_id;
        existingTransaction.transactionId = transactionId;
        existingTransaction.amount_INR = therapist.inrPrice;
        existingTransaction.discountPercent = discountPercent;
        existingTransaction.payment_status = "PAYMENT_INITIATED";
        await existingTransaction.save();
      } else {
        const initiatedTransaction = new Transaction({
          transactionId,
          therapist_id,
          type: "single",
          slotId: slot_id,
          method: "phonepay",
          user_id: user._id,
          end_time: endDateTime,
          couponCode: coupon_code,
          fixDiscount: fixDiscount,
          start_time: startDateTime,
          category: specialization_id,
          discountPercent: discountPercent,
          payment_status: "PAYMENT_INITIATED",
          amount_INR: Math.round((amountToPay * 100) / 10000),
        });
        await initiatedTransaction.save();
      }
      await Slot.updateOne(
        {
          therapist_id: new mongoose.Types.ObjectId(therapist_id),
          "timeslots._id": new mongoose.Types.ObjectId(slot_id),
        },
        { $set: { "timeslots.$.isBooked": true } }
      );
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
export async function processPaymentForcourse(req, res) {
  try {
    const user = req.user;
    const { therapist_id, courseId, type = "course", coupon_code } = req.body;
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
      throw new ApiError(404, "Course not found or invalid!");
    }
    let amountToPay = course.inrPrice * 100;
    let discountPercent = 0;
    let fixDiscount = 0;
    if (coupon_code) {
      const coupon = await Coupon.findOne({ code: coupon_code });
      if (!coupon || coupon.expiryDate < new Date() || !coupon.isActive) {
        return res
          .status(200)
          .json(new ApiResponse(200, "", "Coupon not found or expired"));
      }
      if (
        !coupon.specializationId.equals(
          new mongoose.Types.ObjectId(course.specializationId)
        )
      ) {
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              "",
              "this coupon is not valid for this category"
            )
          );
      }
      if (coupon.currencyType !== "INR") {
        return res
          .status(200)
          .json(new ApiResponse(200, "", "This coupon is not valid in india"));
      }
      if (coupon.type === "percentage") {
        amountToPay =
          (course.inrPrice * 100 * (100 - coupon.discountPercentage)) / 100;
        discountPercent = coupon.discountPercentage;
      } else {
        amountToPay = course.inrPrice * 100 - coupon.fixDiscount * 100;
        fixDiscount = coupon.fixDiscount;
      }
    }

    let existingTransaction = await Transaction.find({
      user_id: user._id,
      courseId: courseId,
      method: "phonepay",
      therapist_id: therapist_id,
      category: course.specializationId,
      payment_status: "PAYMENT_INITIATED",
    });

    let transactionId = `unfazed${uniqid()}`;

    const normalPayLoad = {
      merchantId: process.env.MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: `MUID_${user._id}`,
      amount: amountToPay,
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
      url: `${process.env.HOST_URL}/pg/v1/pay`,
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
      if (existingTransaction && existingTransaction.length > 0) {
        console.log("Updating Existing transaction...");
        existingTransaction = existingTransaction[0];
        existingTransaction.type = type;
        existingTransaction.courseId = courseId;
        existingTransaction.couponCode = coupon_code;
        existingTransaction.fixDiscount = fixDiscount;
        existingTransaction.transactionId = transactionId;
        existingTransaction.amount_INR = therapist.inrPrice;
        existingTransaction.discountPercent = discountPercent;
        existingTransaction.category = course.specializationId;
        await existingTransaction.save();
      } else {
        const initiatedTransaction = new Transaction({
          transactionId,
          user_id: user._id,
          therapist_id,
          courseId,
          category: course.specializationId,
          amount_INR: Math.round((amountToPay * 100) / 10000),
          payment_status: "PAYMENT_INITIATED",
          type,
          discountPercent: discountPercent,
          fixDiscount: fixDiscount,
          couponCode: coupon_code,
          method: "phonepay",
        });
        await initiatedTransaction.save();
      }
      res.status(200).json(
        new ApiResponse(200, {
          redirect_url: response.data.data.instrumentResponse.redirectInfo.url,
        })
      );
    } catch (error) {
      console.error("Payment request error:", error);
      return res
        .status(500)
        .json(new ApiError(500, "Payment initialization failed"));
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
        "X-MERCHANT-ID": `${process.env.MERCHANT_ID}`,
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
export const callback = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  console.log(transactionId);
  try {
    // Find the transaction by transactionId
    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    const { status, amount, paymentMode } = req.body;
    console.log("call back response-------------", req.body);

    // Verify the status and update the transaction accordingly
    if (status === "SUCCESS") {
      transaction.payment_status = "successful";
    } else if (status === "FAILURE") {
      transaction.payment_status = "failed";
      // You might also want to roll back any booking or slot reservation here
    }

    res.status(200).json({ message: "Payment status updated" });
  } catch (error) {
    console.error("Error handling payment callback:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
