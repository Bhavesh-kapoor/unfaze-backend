import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Course } from "../models/courseModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { check, validationResult } from "express-validator";
import { Types } from "mongoose";
const validateInput = [
  check("sessionOffered", " session_count is required").notEmpty(),
  check("usdPrice", "usdPrice Name is required").notEmpty(),
  check("inrPrice", "inrPrice Name is required").notEmpty(),
  check("specializationId", "specialization is required").notEmpty(),
];
const createCourse = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json(new ApiError(400, "Validation error"));
  }

  const { sessionOffered, usdPrice, inrPrice, specializationId } = req.body;

  try {
    const existingCourse = await Course.findOne({
      specializationId,
      sessionOffered,
    });

    if (existingCourse) {
      return res.status(403).json(new ApiError(403, "Course already exists"));
    }

    const newCourse = new Course({
      sessionOffered,
      usdPrice,
      inrPrice,
      specializationId,
    });

    await newCourse.save();

    return res
      .status(201)
      .json(new ApiResponse(201, newCourse, "Course created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Something went wrong"));
  }
});

const updateCourse = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  try {
    const updatedCourse = await Course.findByIdAndUpdate(_id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedCourse) {
      throw new ApiError(404, "Course not found");
    }

    res
      .status(200)
      .json(new ApiResponse(200, updatedCourse, "Course updated successfully"));
  } catch (error) {
    console.error("Error updating course:", error);
    throw new ApiError(
      501,
      "Something went wrong while updating the course",
      error
    );
  }
});
const deleteCourse = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  try {
    const deletedCourse = await Course.findByIdAndDelete(_id);

    if (!deletedCourse) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Course not found"));
    }

    res
      .status(200)
      .json(new ApiResponse(200, null, "Course deleted successfully"));
  } catch (error) {
    console.error("Error deleting course:", error);
    throw new ApiError(501, "Something went wrong while deleting the course");
  }
});

const findList = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  try {
    const pipeline = [
      {
        $lookup: {
          from: "specializations",
          localField: "specializationId",
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
          sessionOffered: 1,
          usdPrice: 1,
          inrPrice: 1,
          isActive: 1,
          category: "$specializations.name",
          categoryId: "$specializations._id",
        },
      },
      { $skip: skip },
      { $limit: limitNumber },
    ];

    const totalCourses = await Course.countDocuments();
    const getList = await Course.aggregate(pipeline);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          result: getList,
          pagination: {
            currentPage: pageNumber,
            totalPages: Math.ceil(totalCourses / limitNumber),
            totalItems: totalCourses,
            itemsPerPage: limitNumber,
          },
        },
        "Courses fetched successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw new ApiError(501, "Something went wrong while fetching the courses");
  }
});

const findById = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  if (!_id) {
    return res
      .status(400)
      .json(new ApiError(400, null, "Course ID is required"));
  }

  try {
    const courseId = new Types.ObjectId(_id);

    const pipeline = [
      {
        $match: { _id: courseId },
      },
      {
        $lookup: {
          from: "specializations",
          localField: "specializationId",
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
          sessionOffered: 1,
          usdPrice: 1,
          inrPrice: 1,
          isActive: 1,
          category: "$specializations.name",
          specializationId: "$specializations._id",
        },
      },
    ];

    const course = await Course.aggregate(pipeline);

    if (!course || course.length === 0) {
      return res.status(404).json(new ApiError(404, null, "Course not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, course[0], "Course fetched successfully"));
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw new ApiError(501, "Something went wrong while fetching the course");
  }
});

const purchaseAcourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
});

export {
  validateInput,
  createCourse,
  updateCourse,
  deleteCourse,
  findList,
  findById,
};
