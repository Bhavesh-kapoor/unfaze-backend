import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Course } from "../models/courseModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { check, validationResult } from "express-validator";

const validateInput = [
  check("session_offered", " session_count is required").notEmpty(),
  check("usdPrice", "usdPrice Name is required").notEmpty(),
  check("inrPrice", "inrPrice Name is required").notEmpty(),
  check("specialization_id", "specialization is required").notEmpty(),
];
const createCourse = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json(new ApiError(400, "Validation error"));
  }

  const { session_offered, usdPrice, inrPrice, specialization_id } = req.body;

  try {
    const existingCourse = await Course.findOne({
      specialization_id,
      session_offered,
    });

    if (existingCourse) {
      return res.status(403).json(new ApiError(403, "Course already exists"));
    }

    const newCourse = new Course({
      session_offered,
      usdPrice,
      inrPrice,
      specialization_id,
    });

    await newCourse.save();

    return res.status(201).json(new ApiResponse(201, newCourse, "Course created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Something went wrong"));
  }
});

const updateCourse = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  try {
    const updatedCourse = await Course.findByIdAndUpdate(
      _id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      throw new ApiError(404, "Course not found");
    }

    res.status(200).json(new ApiResponse(200, updatedCourse, "Course updated successfully"));
  } catch (error) {
    console.error("Error updating course:", error);
    throw new ApiError(501, "Something went wrong while updating the course", error);
  }
});
const deleteCourse = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  try {
    const deletedCourse = await Course.findByIdAndDelete(_id);

    if (!deletedCourse) {
      return res.status(404).json(new ApiResponse(404, null, "Course not found"));
    }

    res.status(200).json(new ApiResponse(200, null, "Course deleted successfully"));
  } catch (error) {
    console.error("Error deleting course:", error);
    throw new ApiError(501, "Something went wrong while deleting the course");
  }
});

const findList = asyncHandler(async (req, res) => {
  try {
    const pipeline = [
      {
        $lookup: {
          from: "specializations",
          localField: "specialization_id",
          foreignField: "_id",
          as: "specializations",
        },
      },
      {
        $unwind: {
          path: "$specializations",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          session_offered: 1,
          category: 1,
          usdPrice: 1,
          inrPrice: 1,
          isActive: 1,
          inrPrice: 1,
          category: "$specializations.name"
        },
      }
    ];

    const getList = await Course.aggregate(pipeline);

    res.status(200).json(new ApiResponse(200, getList, "Courses fetched successfully"));
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw new ApiError(501, "Something went wrong while fetching the courses");
  }
});

const purchaseAcourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params
})

export { validateInput, createCourse, updateCourse, deleteCourse, findList };
