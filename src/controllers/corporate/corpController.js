import { check } from "express-validator";
import { CorpUser } from "../../models/corporate/corporateUserModel.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const validateRegister = [
  check("firstName", "First Name is required").notEmpty(),
  check("lastName", "Last Name is required").notEmpty(),
  check("email", "Email is required").isEmail(),
  check("mobile", "Mobile is required").notEmpty(),
  check("gender", "Gender is required").notEmpty(),
  check("orgatizationName", "orgatizationName is required").notEmpty(),
  check("role", "role is required").notEmpty(),
  check("country", "country is required").notEmpty(),
  check("state", "state is required").notEmpty(),
  check("city", "city is required").notEmpty(),
];

const register = asyncHandler(async (req, res) => {
  try {
    let profileImagePath;
    const newUser = req.body;
    const existingUser = await CorpUser.findOne({ email: newUser.email })
    if (!existingUser) {
      return res.status(400).json(new ApiResponse(400, null, "Email already exists!"));
    }
    if (req?.file?.path) profileImagePath = req.file.path;
    const newCorpUser = new CorpUser({
      ...newUser,
      profileImage: profileImagePath ? profileImagePath : "",
    });
    await adminUser.save();
    return res.status(200).json(new ApiResponse(200, newCorpUser, "Corporate user register successfully!"));
  } catch (error) {
    console.error(error);
    res.status(500).json(new ApiError(500, null, error.message));
  }
})
export { register }
