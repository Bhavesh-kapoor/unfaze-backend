import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { Course } from "../../models/courseModel.js";
import AysncHandler from "../../utils/AysncHandler.js";
import { check, validationResult } from "express-validator";

const validateInput = [
  check("session_count", " session_count is required").notEmpty(),
  check("cost", "cost Name is required").notEmpty(),
  check("specialization_id", "specialization is required").notEmpty(),
];
const createCourse = AysncHandler(async (req, res) => {
  const therapist_id = req.user?._id;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "validation error");
  }
  const { session_count, cost, specialization_id } = req.body;
  try {
    const existingCourse = await Course.findOne({
      therapist_id,
      specialization_id,
      session_count,
    });

    if (existingCourse) {
      throw new ApiError(409, "Course already exists");
    }
    const newCourse = new Course({
      therapist_id,
      session_count,
      cost,
      specialization_id,
    });

    await newCourse.save();
    res
      .status(201)
      .json(new ApiResponse(201, newCourse, "Course created Successfully"));
  } catch (error) {
    throw new ApiError(501, "Something went wrong while adding a course");
  }
});

const updateCourse = AysncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res
      .status(400)
      .json(new ApiResponse(400, errors.array(), "Validation error"));
  }
  const therapist_id = req.user?._id;
  const { _id } = req.params;
  const { session_count, cost, specialization } = req.body;
 
  try {
    const course = await Course.find({_id})
    if(course.therapist_id !== therapist_id){
    throw new ApiError(501,"Unauthorized user request!")
   }
    const updatedCourse = await Course.findByIdAndUpdate(
      _id,
      { therapist_id, session_count, cost, specialization },
      { new: true }
    );

    if (!updatedCourse) {
      throw new ApiError(404, "Course not found");
    }

    res
      .status(200)
      .json(new ApiResponse(200, updatedCourse, "Course updated successfully"));
  } catch (error) {
    console.error("Error updating course:", error);
    throw new ApiError(501, "Something went wrong while updating the course");
  }
});
const deleteCourse = AysncHandler(async (req, res) => {
  const { _id } = req.params;

  try {
    const deletedCourse = await Course.findByIdAndDelete(_id);

    if (!deletedCourse) {
      throw new ApiError(404, "Course not found");
    }
    res
      .status(200)
      .json(new ApiResponse(200, null, "Course deleted successfully"));
  } catch (error) {
    console.error("Error deleting course:", error);
    throw new ApiError(501, "Something went wrong while deleting the course");
  }
});
const findList = AysncHandler(async (req, res) => {
  try {
    const pipeline = [
      { $match: { therapist_id: req.user?._id } },
      {
        $lookup: {
          from: "specializations",
          localField: "specialization_id",
          foreignField: "_id",
          as: "specializations",
        },
      },
      {
        $unwind: "$specializations",
      },
      {
        $addFields: {
          category: "$specializations.name",
        },
      },
      {
        $project: {
          _id: 1,
          therapist_id: 1,
          session_count: 1,
          category: 1,
          cost: 1,
        },
      },
    ];

    const getList = await Course.aggregate(pipeline);
    res
      .status(200)
      .json(new ApiResponse(200, getList, "Courses fetched successfully"));
  } catch (error) {
    console.error("Error deleting course:", error);
    throw new ApiError(501, "Something went wrong while fetching the course");
  }
});

export { validateInput, createCourse, updateCourse, deleteCourse, findList };
