import jwt from "jsonwebtoken";
import ApiError from "../../utils/ApiError.js";
import { User } from "../../models/userModel.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { Therapist } from "../../models/therapistModel.js";

// Middleware function to verify JWT token
const verifyJwtToken = asyncHandler(async (req, res, next) => {
  try {
    // Get token from cookies or headers
    const token =
      req.cookies?.accesstoken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(404).json(new ApiError(404, "Token Not Found!"));
    }

    // Verify JWT token
    const verified = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    console.log(verified)

    if (!verified) {
      return res.status(498).json(new ApiError(498, "Invalid Token"));
    }

 // Find user based on role
    let user;
    if (verified.role === "admin" || verified.role === "user") {
      user = await User.findById(verified._id).select(
        "-password -refreshToken"
      );
    } else {
      user = await Therapist.findById(verified._id).select(
        "-password -refreshToken"
      );
    }

    if (!user) {
      return res.status(404).json(new ApiError(404, "User Not Found"));
    }

    // Attach user to the request object
    req.user = user;
    next();
  } catch (error) {
    console.error(error); // Log the error for debugging
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(498).json(new ApiError(498, "Invalid Token"));
    }
    return res.status(401).json(new ApiError(401, "Unauthorized"));
  }
});

export default verifyJwtToken;
