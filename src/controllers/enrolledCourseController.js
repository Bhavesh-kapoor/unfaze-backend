import { EnrolledCourse } from "../models/enrolledCourse.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Course } from "../models/courseModel.js";

const getEnrolledCourseList = asyncHandler(async (req, res) => {
  const user_id = req.user?._id;
  const enrolledList = await EnrolledCourse.find({ user_id });
  if (!enrolledList) {
    throw new ApiError(404, "You'r not enrolled in any course!");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, enrolledList, "list fetched successfully"));
});

const handlePaymentSuccess = asyncHandler(async (req, res) => {
  const { paymentDetails, course_id } = req;
  const course = await Course.findOne({ _id: course_id });
  if (paymentDetails.code === "PAYMENT_SUCCESS") {
    const newEnrollment = new EnrolledCourse({
      course_id: course_id,
      user_id: req.user?._id,
      payment_status: paymentDetails.code,
      transaction_id: paymentDetails.transactionId,
      amount: paymentDetails.amount,
      remaining_sessions: course.session_count,
      merchantTransactionId: paymentDetails.data.merchantTransactionId,
      transaction_id: paymentDetails.data.transactionId,
      amount: paymentDetails.data.amount,
      remaining_sessions: course.session_count,
      status: paymentDetails.data.state,
      statusCode: paymentDetails.data.responseCode,
      paymentMode: paymentDetails.data.paymentInstrument.type,
      active:true
    });
    await newEnrollment.save();
    res
      .status(200)
      .json(
        new ApiResponse(200, newEnrollment, "Enrolled  in course successfully")
      );
  } else {
    res.status(400).json(new ApiError(400, "Something went wrong!!!"));
  }
});
export { getEnrolledCourseList, handlePaymentSuccess };
