import { EnrolledCourse } from "../models/enrolledCourse.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { check, validationResult } from "express-validator";
import asyncHandler from "../utils/asyncHandler.js";
import { Course } from "../models/courseModel.js";

const validateInput = [
  check("session_count", "session_count is required").notEmpty(),
  check("amount", "amount is required").notEmpty(),
  check("transaction_id", "transaction_id is required").notEmpty(),
];

const enrollInCourse = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json(new ApiError(400, "Validation Error", errors.array()));
  }

  // const { payment_status, transaction_id, amount } = req.body;
  // const { paymentValidation } = req;
  // const course_id = req.params.course_id;
  // const user_id = req.user?._id;
  // const course = Course.find({ course_id });
  // if (!course) {
  //   return res.status(404).json(new ApiResponse(404, "", "invalid course"));
  // }
  // const enrolledCourse = new EnrolledCourse({
  //   course_id,
  //   user_id,
  //   payment_status,
  //   transaction_id,
  //   amount,
  // });
  // await enrolledCourse.save();

  res
    .status(200)
    .json(new ApiResponse(200, "Enrolled successfully"));
});

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

//  const handlePaymentSuccess = async (req, res) => {
//   try {
//     const { paymentDetails } = req;
//     const { paymentValidation } = req;

//     if (paymentValidation.code === "PAYMENT_SUCCESS") {
//       const newEnrollment = new EnrolledCourse({
//         course_id: req.params.course_id,
//         user_id: req.user?._id,
//         payment_status: paymentValidation.code,
//         transaction_id: paymentDetails.transactionId,
//         amount: paymentDetails.amount,
//         remaining_sessions: 10, // assuming a default value for demo purposes
//       });

//       await newEnrollment.save();
//       res.status(200).json({ message: "Payment successful and enrollment recorded" });
//     } else {
//       res.status(400).json({ message: "Payment failed or pending" });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
export { enrollInCourse, getEnrolledCourseList, validateInput };
