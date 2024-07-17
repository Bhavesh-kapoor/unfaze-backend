import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { Course } from "../../models/courseModel.js";
import AysncHandler from "../../utils/AysncHandler.js";
import { check, validationResult } from "express-validator";

const validateRegister = [
  check("session_count", " session_count is required").notEmpty(),
  check("cost", "cost Name is required").notEmpty(),
  check("specialization", "specialization is required").notEmpty(),
];
const createCourse = AysncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "validation error");
  }
  const { therapist_id, session_count, cost, specialization } = req.body;

  try {
    const existingCourse = await Course.findOne({
      therapist_id,
      specialization,
      session_count,
    });

    if (existingCourse) {
      throw new ApiError(409, "Course already exists");
    }
    const newCourse = new Course({
      therapist_id,
      session_count,
      cost,
      specialization,
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
    throw new ApiError(400, "validation error");
  }
  const { id } = req.params;
  const { therapist_id, session_count, cost, specialization } = req.body;
});
const deleteCourse = AysncHandler(async (req, res) => {});
const findList = AysncHandler(async (req, res) => {});

export { validateRegister, createCourse, updateCourse, deleteCourse, findList };
