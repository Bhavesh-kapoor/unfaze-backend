import { EnrolledCourse } from "../models/enrolledCourse.model";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { check, validationResult } from "express-validator";
import { Course } from "../models/courseModel";
import asyncHandler from "../utils/asyncHandler";

const validateInput = [
    check("session_count", " session_count is required").notEmpty(),
    check("cost", "cost Name is required").notEmpty(),
    check("specialization_id", "specialization is required").notEmpty(),
  ];

  const enrollInCorse = asyncHandler(async(req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "validation error");
    }
    const {payment_status,transaction_id,amount}  = req.body;
    const course_id = req.params
    const user_id =req.user?._id
    const enrolledCourse = EnrolledCourse.create({
      course_id,
      user_id,
      payment_status,
      transaction_id,
      amount,
    })
    enrolledCourse.save();

    res.status(200).json(new ApiResponse())
  })

  
  export {enrollInCorse}