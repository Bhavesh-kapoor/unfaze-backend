import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { EnrolledCourse } from "../models/enrolledCourseModel.js";
import { Course } from "../models/courseModel.js";
import { Types } from "mongoose";

const findById = asyncHandler(async(req,res)=>{
    const {_id}=req.params
  const enrolledCourse = await EnrolledCourse.findById(Types.ObjectId(_id)).populate(transactionId)
  if(!enrolledCourse){
    
  }

})
const getEnrolledInCourse=asyncHandler(async(req,res)=>{
  try {
    const user = req.user
  const transaction = req.transaction
  const {courseId,therapistId}=req.body
  const course = await Course.find({courseId:Types.ObjectId(courseId)})
  if(!course){
  throw new ApiError(404,"Course not found!")
  }
  const remainingSessions = course.sessionOffered
  const enrolledCourse = await EnrolledCourse.create({transactionId:transaction._id,courseId,userId:user._id,therapistId, remainingSessions})
  res.status(201).json(new ApiResponse(201,enrolledCourse,"Enrolled in course successfully!"))
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Something went wrong", error))
  }
})