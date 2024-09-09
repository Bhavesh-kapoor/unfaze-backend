import jwt from "jsonwebtoken";
import { process } from "uniqid";
import ApiError from "../../utils/ApiError.js";
import { verifyOTP } from "../otpController.js";
import { User } from "../../models/userModel.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { check, validationResult } from "express-validator";
import { parseISO, addDays, startOfDay, endOfDay } from "date-fns";

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
  const { email, firstName, lastName, password, mobile, dateOfBirth, gender, otp } =
    req.body;
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
    dateOfBirth,
    profileImage,
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

  const updatedUser = await User.findByIdAndUpdate(userId, req.body, {
    new: true,
  });
  if (!updatedUser) {
    return res.status(404).json(new ApiError(404, "", "User not found"));
  }
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
};
