import { EnrolledCourse } from "../models/enrolledCourse.model";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { check, validationResult } from "express-validator";
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
    try {
        
    } catch (error) {
        
    }
  })