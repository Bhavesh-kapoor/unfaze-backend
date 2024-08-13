import { Therapist } from "../../models/therapistModel.js";
import { User } from "../../models/userModel.js";
import ApiError from "../../utils/ApiError.js";
import AysncHandler from "../../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const verifyJwtToken = AysncHandler(async (req, res, next) => {
  try {
    let token =
      req.cookies?.accesstoken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(400).json(new ApiError(400, "", "Token Not Found!"));
    }
    // Verify JWT token
    const verified = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    if (!verified) {
      return res.status(409).json(new ApiError(409, "", "Invalid Token"));
    }
    // Find user by id
    let user = await User.findById(verified._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      // If user not found, check for therapist
      user = await Therapist.findById(verified._id).select(
        "-password -refreshToken"
      );
      if (!user) {
        return res
          .status(422)
          .json(new ApiError(422, "", "User or Therapist does not exist!"));
      }
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json(new ApiError(401, "", "Unauthorized"));
  }
});

export default verifyJwtToken;
