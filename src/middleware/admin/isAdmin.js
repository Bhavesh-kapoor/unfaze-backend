
import { User } from "../../models/userModel.js";
import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const isAdmin = asyncHandler(async (req, res, next) => {
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
 
    let user = await User.findById(verified._id).select(
      "-password -refreshToken"
    );
    if(user.role !== "admin"){
        return res.status(501).json(new ApiError(501,"","user is not an admin!"))
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json(new ApiError(401, "", "Unauthorized"));
  }
});

export default isAdmin;
