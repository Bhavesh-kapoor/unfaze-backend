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

    const { payment_status, transaction_id, amount } = req.body;
    const course_id = req.params.course_id; 
    const user_id = req.user?._id;
    const course = Course.find({course_id});
    console.log("course-----",course);
    const enrolledCourse = new EnrolledCourse({
        course_id,
        user_id,
        payment_status,
        transaction_id,
        amount,
    });
    await enrolledCourse.save();


    res.status(200).json(new ApiResponse(200,enrolledCourse,"Enrolled successfully"));
});

export { enrollInCourse,validateInput };
