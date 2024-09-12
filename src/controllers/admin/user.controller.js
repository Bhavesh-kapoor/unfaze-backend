import jwt from "jsonwebtoken";
import { process } from "uniqid";
import ApiError from "../../utils/ApiError.js";
import { verifyOTP } from "../otpController.js";
import { User } from "../../models/userModel.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { check, validationResult } from "express-validator";
import { parseISO, addDays, startOfDay, endOfDay } from "date-fns";
import path from "path";
import fs from "fs";
import { sendMobileOtp } from "../otpController.js";
import { sendOtpMessage } from "../../config/msg91.config.js";
import { createAndStoreMobileOTP } from "../otpController.js";
import { mailOptions } from "../../config/nodeMailer.js";
import { transporter } from "../../config/nodeMailer.js";
import { otpContent } from "../../static/emailcontent.js";

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
    return res.status(404).json(new ApiError(404, "", "Email Not Found!"));

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

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
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
  const { email, otp } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json(new ApiError(400, "Validation Error", errors.array()));
  }
  if (!verifyOTP(email, otp)) {
    return res.status(201).json(new ApiError(201, "", "Invalid OTP"));
  }

  let profileImage = req.file ? req.file.path : "";
  const exist = await User.findOne({ email });
  if (exist) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Email_already_exist"));
  }

  const newUser = await User.create({
    ...req.body,
    isEmailVerified: true,
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
    .json(
      new ApiResponse(
        200,
        {
          accessToken: accessToken,
          refreshToken: refreshToken,
          user: newUser,
        },
        "User created successfully"
      )
    );
});

const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  console.log(req.user);
  if (!userId) {
    return res
      .status(401)
      .json(new ApiError(401, "", "User not authenticated"));
  }

  const user = req.body;

  let profileImage = req.file ? req.file.path : "";

  try {
    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json(new ApiError(404, "", "User not found"));
    }
    if (existingUser.profileImage && profileImage) {
      if (fs.existsSync(existingUser.profileImage)) {
        fs.unlinkSync(existingUser.profileImage);
      }
    }
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { ...user, profileImage },
      {
        new: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json(new ApiError(404, "", "User not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "User updated successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError(500, "", "Server error"));
  }
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

const allUser = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    startDate,
    endDate,
    sortkey = "createdAt",
    sortdir = "desc",
  } = req.query;

  // Pagination
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  // Search and Date Filter
  let filter = { role: "user" };

  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: "i" } },
      { mobile: search },
    ];
  }

  if (startDate && endDate) {
    filter.createdAt = {
      $gte: startOfDay(parseISO(startDate)),
      $lt: endOfDay(addDays(parseISO(endDate), 1)),
    };
  } else if (startDate) {
    filter.createdAt = {
      $gte: startOfDay(parseISO(startDate)),
    };
  } else if (endDate) {
    filter.createdAt = {
      $lt: endOfDay(addDays(parseISO(endDate), 1)),
    };
  }

  // Fetching Users
  const userList = await User.find(filter)
    .select("-password -refreshToken")
    .sort({ [sortkey]: sortdir === "desc" ? -1 : 1 })
    .skip(skip)
    .limit(limitNumber);

  if (!userList) {
    return res
      .status(400)
      .json(new ApiError(404, "", "User list fetching failed!"));
  }

  const totalUsers = await User.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        pagination: {
          totalItems: totalUsers,
          totalPages: Math.ceil(totalUsers / limitNumber),
          currentPage: pageNumber,
          itemsPerPage: limitNumber,
        },
        result: userList,
      },
      "User list fetched successfully"
    )
  );
});

export const getAllAdminList = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    startDate,
    endDate,
    sortkey = "createdAt",
    sortdir = "desc",
  } = req.query;

  // Pagination
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  // Search and Date Filter
  let filter = { role: "admin" };

  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: "i" } },
      { mobile: search },
    ];
  }

  if (startDate && endDate) {
    filter.createdAt = {
      $gte: startOfDay(parseISO(startDate)),
      $lt: endOfDay(addDays(parseISO(endDate), 1)),
    };
  } else if (startDate) {
    filter.createdAt = {
      $gte: startOfDay(parseISO(startDate)),
    };
  } else if (endDate) {
    filter.createdAt = {
      $lt: endOfDay(addDays(parseISO(endDate), 1)),
    };
  }

  // Fetching Users
  const userList = await User.find(filter)
    .select("-password -refreshToken")
    .sort({ [sortkey]: sortdir === "desc" ? -1 : 1 })
    .skip(skip)
    .limit(limitNumber);

  if (!userList) {
    return res
      .status(400)
      .json(new ApiError(404, "", "User list fetching failed!"));
  }

  const totalUsers = await User.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        pagination: {
          totalItems: totalUsers,
          totalPages: Math.ceil(totalUsers / limitNumber),
          currentPage: pageNumber,
          itemsPerPage: limitNumber,
        },
        result: userList,
      },
      "User list fetched successfully"
    )
  );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

export const getAdminDetails = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = await User.findOne(
      { _id: id, role: "admin" },
      {
        _id: 1,
        dateOfBirth: 1,
        role: 1,
        email: 1,
        mobile: 1,
        isActive: 1,
        password: 1,
        lastName: 1,
        firstName: 1,
        permissions: 1,
        profileImage: 1,
      }
    );

    if (!adminUser) {
      return res
        .status(404)
        .json({ success: false, message: "Admin user not found" });
    }

    res.status(200).json({ success: true, data: adminUser });
  } catch (error) {
    console.error("Error fetching admin user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export const updateAdminDetails = asyncHandler(async (req, res) => {
  try {
    let profileImagePath;
    const { id } = req.params;
    const updates = req.body;

    if (req?.file?.path) profileImagePath = req.file.path;

    const adminUser = await User.findOne({ _id: id, role: "admin" });

    if (!adminUser) {
      return res
        .status(404)
        .json({ success: false, message: "Admin user not found" });
    }

    Object.assign(adminUser, {
      ...updates,
      profileImage: profileImagePath
        ? profileImagePath
        : adminUser.profileImage,
    });

    await adminUser.save();
    return res.status(200).json({ success: true, data: adminUser });
  } catch (error) {
    console.error("Error updating admin user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export const deleteAdmin = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const document = await User.findByIdAndDelete(_id);
  if (!document) {
    return res.status(404).json(new ApiError(404, "", "invalid Docs!"));
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "", "Blog category deleted successfully"));
});

export const createAdmin = asyncHandler(async (req, res) => {
  try {
    let profileImagePath;
    const updates = req.body;
    if (req?.file?.path) profileImagePath = req.file.path;
    const adminUser = new User({
      ...updates,
      profileImage: profileImagePath ? profileImagePath : "",
    });
    await adminUser.save();
    return res.status(200).json({ success: true, data: adminUser });
  } catch (error) {
    console.error("Error updating admin user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  try {
    const { email, mobile } = req.body;
    const user = await User.findOne({ $or: [{ email }, { mobile }] });
    if (!user) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, null, "You are not associated with any Account!")
        );
    }
    const otp = await createAndStoreMobileOTP(mobile);
    const response = await sendOtpMessage(user.mobile, otp);
    console.log("OTP sent on mobile successfully:", response);
    const htmlContent = otpContent(otp);
    const options = mailOptions(
      user.email,
      "Email verification code - Unfaze",
      htmlContent
    );
    transporter.sendMail(options, (error, info) => {
      if (error) {
        console.log(error);
      }
      console.log("Email Otp sent: %s", info.messageId);
    });
    return res
      .status(200)
      .json(
        new ApiResponse(200, null, "OTP sent on your registered mobile number")
      );
  } catch (error) {
    console.log(error);
    return res.status(500).json(new ApiError(500, error, "Error sending OTP"));
  }
});
export {
  adminlogin,
  userlogin,
  register,
  refreshToken,
  validateRegister,
  updateAvatar,
  updateProfile,
  allUser,
  getCurrentUser,
  changeCurrentPassword,
  forgotPassword,
};
