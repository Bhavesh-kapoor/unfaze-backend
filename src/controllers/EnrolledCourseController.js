import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { EnrolledCourse } from "../models/enrolledCourseModel.js";
import { Course } from "../models/courseModel.js";
import { Types } from "mongoose";
import { Therapist } from "../models/therapistModel.js";
import { sendNotificationsAndEmails } from "./paymentHandler.js";
import { courseEnrollmentConfirmation } from "../static/emailcontent.js";

const findById = asyncHandler(async (req, res) => {
  const { _id } = req.params
  const enrolledCourse = await EnrolledCourse.findById(Types.ObjectId(_id)).populate(transactionId)
  if (!enrolledCourse) {
    return res.status(404).json(new ApiError(404, "", "Course not found"));
  }
})
const getEnrolledInCourse = asyncHandler(async (req, res) => {
  const mapPaymentStatus = (responseCode) => {
    const statusMap = {
      PENDING: "pending",
      SUCCESS: "successful",
      FAILED: "failed",
      REFUNDED: "refunded",
    };
    return statusMap[responseCode] || "pending";
  };
  try {
    const { paymentDetails, transaction } = req;
    const user = req.user;
    const therapist = await Therapist.findById(transaction.therapist_id);
    if (!therapist) {
      return res.status(404).json({ error: "Therapist not found" });
    }
    const existingenrollment = await EnrolledCourse.findOne({ transactionId: transaction._id })
    if (existingenrollment) {
      return res.status(409).json(new ApiError(409, "", "course enrolled already with this transaction"))
    }
    const order_status = mapPaymentStatus(paymentDetails?.data?.responseCode);
    transaction.payment_details = paymentDetails;
    paymentDetails.payment_status = order_status;
    transaction.payment_status = order_status;
    transaction.save();

    if (order_status === "successful") {
      const course = await Course.findById(transaction.courseId);
      const enrolledCourse = new EnrolledCourse({
        courseId: course._id,
        userId: user._id,
        transactionId: transaction._id,
        therapistId: therapist._id,
        remainingSessions: course.sessionOffered,
        isActive: true,
      });
      enrolledCourse.save()
      const message = `${user.firstName} ${user.lastName} has successfully enrolled in a course.`;
      const htmlContent = courseEnrollmentConfirmation(`${user.firstName} ${user.lastName}`, `${therapist.firstName} ${therapist.lastName}`)
      const subject = "course enrollment confirmation"
      await sendNotificationsAndEmails(transaction, user, therapist, htmlContent, message, subject);
      res
        .status(201)
        .json(new ApiResponse(201, enrolledCourse, "You enrolled in course successfully"));
    } else {
      res.status(200).json(new ApiResponse(200, null, paymentDetails.message));
    }
  } catch (error) {
    console.error("Error in session booking:", error);
    res.status(500).json(new ApiError(500, error, "something went wrong!"));
  }
});

const getEnrolledCashfree = asyncHandler(async (req, res) => {
  const mapPaymentStatus = (responseCode) => {
    const statusMap = {
      ACTIVE: "pending",
      PAID: "successful",
      FAILED: "failed",
      REFUNDED: "refunded",
      CANCELLED: "cancelled",
    };
    return statusMap[responseCode] || "pending";
  };
  try {
    const { paymentDetails, transaction } = req;
    // console.log("paymentDetails", paymentDetails);
    // console.log("paymentDetails", paymentDetails);
    const user = req.user;
    const therapist = await Therapist.findById(transaction.therapist_id);
    if (!therapist) {
      return res.status(404).json({ error: "Therapist not found" });
    }
    const existingenrollment = await EnrolledCourse.findOne({ transactionId: transaction._id })
    if (existingenrollment) {
      return res.status(409).json(new ApiError(409, "", "course enrolled already with this transaction"))
    }
    const order_status = mapPaymentStatus(paymentDetails.order_status);
    transaction.payment_details = paymentDetails.data;
    paymentDetails.payment_status = order_status;
    transaction.payment_status = order_status;
    transaction.save();
    if (order_status === "successful") {
      const course = await Course.findById(transaction.courseId);
      const enrolledCourse = new EnrolledCourse({
        courseId: course._id,
        userId: user._id,
        transactionId: transaction._id,
        therapistId: therapist._id,
        remainingSessions: course.sessionOffered,
        isActive: true,
      });
      enrolledCourse.save()
      const message = `${user.firstName} ${user.lastName} has successfully enrolled in a course.`;
      const htmlContent = courseEnrollmentConfirmation(`${user.firstName} ${user.lastName}`, `${therapist.firstName} ${therapist.lastName}`)
      const subject = "course enrollment confirmation"
      await sendNotificationsAndEmails(transaction, user, therapist, htmlContent, message, subject);
      res
        .status(201)
        .json(new ApiResponse(201, enrolledCourse, "You enrolled in course successfully"));
    } else {
      return res
        .status(200)
        .json(new ApiResponse(200, null, paymentDetails.message));
    }
  } catch (error) {
    console.error("Error in handleCashfreePayment:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Internal Server Error."));

  }
})
export { findById, getEnrolledInCourse, getEnrolledCashfree }