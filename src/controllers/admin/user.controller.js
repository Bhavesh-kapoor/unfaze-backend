import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { User } from "../../models/userModel.js";
import jwt from "jsonwebtoken";
import { check, validationResult } from "express-validator";
import { process } from "uniqid";

const createAccessOrRefreshToken = async (user_id) => {
  const user = await User.findById(user_id);
  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

const validateRegister = [
  check("firstName", "First Name is required").notEmpty(),
  check("lastName", "Last Name is required").notEmpty(),
  check("email", "Email is required").isEmail(),
  check("mobile", "Mobile is required").notEmpty(),
  check("gender", "Gender is required").notEmpty(),
  check("password", "password is required").notEmpty(),
];

const adminlogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email && !password) {
    return res
      .status(409)
      .json(new ApiError(400, "", "Please pass username or email"));
  }

  let existUser = await User.findOne({ $and: [{ email }, { role: "admin" }] });
  if (!existUser)
    return res.status(400).json(new ApiError(400, "", "Email Not Found!"));

  // now check password is correct  or not
  const isPasswordCorrect = await existUser.isPasswordCorrect(password);
  if (!isPasswordCorrect)
    return res.status(401).json(new ApiError(401, "", "Invalid Credentials!"));

  // generate token
  let { accessToken, refreshToken } = await createAccessOrRefreshToken(
    existUser._id
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  const LoggedInUser = await User.findById(existUser._id).select(
    "-password -refreshToken"
  );
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, {
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: LoggedInUser,
      })
    );
});

const userlogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email && !password) {
    return res
      .status(409)
      .json(new ApiError(400, "", "Please pass username or email"));
  }

  let existUser = await User.findOne({ $and: [{ email }, { role: "user" }] });
  if (!existUser)
    return res.status(400).json(new ApiError(400, "", "Email Not Found!"));

  // now check password is correct  or not
  const isPasswordCorrect = await existUser.isPasswordCorrect(password);
  if (!isPasswordCorrect)
    return res.status(401).json(new ApiError(401, "", "Invalid Credentials!"));

  // generate token
  let { accessToken, refreshToken } = await createAccessOrRefreshToken(
    existUser._id
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  const LoggedInUser = await User.findById(existUser._id).select(
    "-password -refreshToken"
  );
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, {
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: LoggedInUser,
      })
    );
});
const register = asyncHandler(async (req, res) => {
  const { email, firstName, lastName, password, mobile, gender } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json(new ApiError(400, "Validation Error", errors.array()));
  }

  let profileImage = req.file ? req.file.path : "";
  const exist = await User.findOne({ email });
  if (exist) {
    return res
      .status(409)
      .json(
        new ApiError(409, "", "User with username or email is already exsist")
      );
  }

  const newUser = await User.create({
    email,
    firstName,
    lastName,
    password,
    mobile,
    gender,
    profileImage,
  });

  newUser.password = undefined;
  newUser.refreshToken = undefined;
  let { accessToken, refreshToken } = await createAccessOrRefreshToken(
    newUser._id
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200,{ accessToken: accessToken,
      refreshToken: refreshToken,user:newUser}, "User created successfully"));
});
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, mobile, gender } = req.body;
  const userId = req.user?._id;

  const user = await User.findById(userId);
  if (!user) {
    return res
      .status(404)
      .json(new ApiError(404,"", "User not found"));
  }

  user.firstName = firstName || user.firstName;
  user.lastName = lastName || user.lastName;
  user.mobile = mobile || user.mobile;
  user.gender = gender || user.gender;

  if (req.file) {
    user.profileImage = req.file.path;
  }

  const updatedUser = await user.save();
  
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const user_id = req.user?._id;
  if (!req.file) {
    return res
      .status(404)
      .json(new ApiError(404), "", " please select an image!");
  }
  const currentUser = await User.findOne({ _id: user_id });
  if (!currentUser) {
    return res.status(404).send(new ApiError(404, "", "Invalid User!"));
  }
  let profileImage = req.file ? req.file.path : "";
  currentUser.profileImage = profileImage;
  await currentUser.save();
  res
    .status(200)
    .json(new ApiResponse(200, "", "profile image uploaded successfully!"));
});

const refreshToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incommingRefreshToken)
    res.status(400).json(new ApiError(400, "", "Pleass Pass refresh token!"));
  // now verify the jwt token
  const decodedToken = await jwt.verify(
    incommingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  const getUserinfo = await User.findById(decodedToken?._id);
  if (!getUserinfo) res.status(400).json(new ApiError(400, "", "Invaid User"));

  if (getUserinfo?.refreshToken !== incommingRefreshToken) {
    res
      .status(401)
      .json(new ApiError(401, "", "Token has been expired or used"));
  }
  const options = {
    httpOnly: true,
    secure: true,
  };

  // now create token
  const { accessToken, refreshToken } = createAccessOrRefreshToken(
    getUserinfo?._id
  );
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, {
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: LoggedInUser,
      })
    );
});

export {
  adminlogin,
  userlogin,
  register,
  refreshToken,
  validateRegister,
  updateAvatar,
};
