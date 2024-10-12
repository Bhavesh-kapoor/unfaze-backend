import { check } from "express-validator";
import { User } from "../../models/userModel.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { createAccessOrRefreshToken } from "../admin/user.controller.js";
import { parseISO, addDays, startOfDay, endOfDay, format } from "date-fns";

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

const registerUser = asyncHandler(async (req, res) => {
  try {
    const admin = req.user
    if (admin.role !== "corp-admin") {
      return res.status(403).json(new ApiError(403, null, "Only corporate admin can register corporate users!"));
    }
    let profileImagePath;
    const newUser = req.body;
    const existingUser = await User.findOne({ email: newUser.email })
    if (!existingUser) {
      return res.status(400).json(new ApiResponse(400, null, "Email already exists!"));
    }
    if (req?.file?.path) profileImagePath = req.file.path;
    const newCorpUser = new User({
      ...newUser,
      profileImage: profileImagePath ? profileImagePath : "",
    });
    await newCorpUser.save();
    return res.status(200).json(new ApiResponse(200, newCorpUser, "Corporate user register successfully!"));
  } catch (error) {
    console.error(error);
    res.status(500).json(new ApiError(500, null, error.message));
  }
})
const registerAdmin = asyncHandler(async (req, res) => {
  const admin = req.user
  if (admin.role !== "admin") {
    return res.status(403).json(new ApiError(403, null, "Only admin can register corporate Admin!"));
  }
  try {
    let profileImagePath;
    const newUser = req.body;
    const existingUser = await User.findOne({ email: newUser.email })
    if (!existingUser) {
      return res.status(400).json(new ApiResponse(400, null, "Email already exists!"));
    }
    if (req?.file?.path) profileImagePath = req.file.path;
    const adminUser = new User({
      ...newUser,
      profileImage: profileImagePath ? profileImagePath : "",
      role: "corp-admin"
    });
    await adminUser.save();
    return res.status(200).json(new ApiResponse(200, newCorpUser, "Corporate user register successfully!"));
  } catch (error) {
    console.error(error);
    res.status(500).json(new ApiError(500, null, error.message));
  }
})

const corpUserlogin = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email && !password) {
      return res
        .status(409)
        .json(new ApiError(400, "", "Please pass username or email"));
    }

    let existUser = await User.findOne({ $and: [{ email }, { role: "corp-user" }] });
    if (!existUser)
      return res.status(400).json(new ApiError(400, "", "Email Not Found!"));

    // now check password is correct  or not
    const isPasswordCorrect = await existUser.isPasswordCorrect(password);
    if (!isPasswordCorrect)
      return res
        .status(401)
        .json(new ApiError(401, "", "Invalid Credentials!"));

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
  } catch (error) {
    return res.status(401).json(new ApiError(401, "", "Invalid Credentials!"));
  }
});
const corpAdminlogin = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email && !password) {
      return res
        .status(409)
        .json(new ApiError(400, "", "Please pass username or email"));
    }

    let existUser = await User.findOne({ $and: [{ email }, { role: "corp-admin" }] });
    if (!existUser)
      return res.status(400).json(new ApiError(400, "", "Email Not Found!"));

    // now check password is correct  or not
    const isPasswordCorrect = await existUser.isPasswordCorrect(password);
    if (!isPasswordCorrect)
      return res
        .status(401)
        .json(new ApiError(401, "", "Invalid Credentials!"));

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
  } catch (error) {
    return res.status(401).json(new ApiError(401, "", "Invalid Credentials!"));
  }
});
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
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
  let filter = { role: "corp-user" };

  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: "i" } },
      { firstName: { $regex: search, $options: "i" } },
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

const allUserBycompany = asyncHandler(async (req, res) => {
  const user = req.user
  const {
    page = 1,
    limit = 10,
    search,
    role,
    startDate,
    endDate,
    sortkey = "createdAt",
    sortdir = "desc",
  } = req.query;
  let orgId;
  if (user.role === "admin") {
    orgId = req.query.orgId;
  } else if (user.role === "corp-admin") {
    orgId = user.orgatizationId
  }
  // Pagination
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  // Search and Date Filter
  let filter = { orgatizationId: new mongoose.Types.ObjectId(orgId) };
  if (role) {
    filter.role = { role: role };
  }

  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: "i" } },
      { firstName: { $regex: search, $options: "i" } },
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
const getOrganizationAdmin = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  const adminList = await User.find({ orgatizationId: new mongoose.Types.ObjectId(orgId), role: "corp-admin" }).select("")
  if (!adminList) {
    return res
      .status(404)
      .json(new ApiError(404, "", "Admin list fetching failed!"));
  }
  return res.status(200).json(new ApiResponse(200, adminList, "Admin list fetched successfully"));
})

export { validateRegister, registerUser, corpAdminlogin, registerAdmin, corpUserlogin, updateProfile, allUser, allUserBycompany, getOrganizationAdmin }
