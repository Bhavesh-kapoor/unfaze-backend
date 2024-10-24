import { body, check, query, validationResult } from "express-validator";
import { User } from "../../models/userModel.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { createAccessOrRefreshToken } from "../admin/user.controller.js";
import { parseISO, addDays, startOfDay, endOfDay, format } from "date-fns";
import { PasswordReset } from "../../models/corporate/passwordResetModel.js";
import { generateSixDigitNumber } from "../../utils/tempPasswordGenerator.js";
import { sendMail } from "../../utils/sendMail.js";
import { createPwdEmailContent } from "../../static/emailcontent.js";
import { convertPathToUrl } from "../admin/TherepistController.js";
import mongoose from "mongoose";
import { CorpPackage } from "../../models/corporate/packageModel.js";
import { isValidObjectId } from "../../utils/mongooseUtility.js";
import { Organization } from "../../models/corporate/organizationModel.js";
import { reqForMoreSession } from "../../static/emailcontent.js";


const sendPwdCreationLink = (receiverEmail, name, link) => {
  const mailContent = createPwdEmailContent(name, link);
  const subject = "Create Your Password for Your New Account at Unfazed"
  sendMail(receiverEmail, subject, mailContent);
}

const validateRegister = [
  check("firstName", "First Name is required").notEmpty(),
  check("lastName", "Last Name is required").notEmpty(),
  check("email", "Email is required").isEmail(),
  check("mobile", "Mobile is required").notEmpty(),
  check("gender", "Gender is required").notEmpty(),
  check("country", "country is required").notEmpty(),
  check("state", "state is required").notEmpty(),
  check("city", "city is required").notEmpty(),
  check("organizationId", "Organization ID is required")
    .optional({ checkFalsy: true })
    .notEmpty().withMessage("Organization ID cannot be empty"),
];

const registerUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json(new ApiError(400, "Validation Error", errors.array()));
  }
  try {
    const admin = req.user
    if (admin.role !== "corp-admin") {
      return res.status(403).json(new ApiError(403, null, "Only corporate admin can register corporate users!"));
    }
    let profileImagePath;
    const newUser = req.body;
    const existingUser = await User.findOne({ email: newUser.email })
    if (existingUser) {
      return res.status(400).json(new ApiResponse(400, null, "Email already exists!"));
    }
    if (req?.file?.path) profileImagePath = convertPathToUrl(req.file.path);
    const newCorpUser = new User({
      ...newUser,
      profileImage: profileImagePath ? profileImagePath : "",
      organizationId: admin.organizationId,
      role: "corp-user"
    });
    await newCorpUser.save();
    const token = generateSixDigitNumber();
    const passwordObject = await PasswordReset.create({
      userId: newCorpUser._id,
      token: token
    });
    const link = `${process.env.FRONTEND_URL}/secure-create-password?token=${token}`
    const name = `${newCorpUser?.firstName} ${newCorpUser?.lastName}`
    sendPwdCreationLink(newCorpUser.email, name, link)
    return res.status(200).json(new ApiResponse(200, newCorpUser, "Corporate user register successfully!"));
  } catch (error) {
    console.error(error);
    res.status(500).json(new ApiError(500, null, error.message));
  }
})
const registerAdmin = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json(new ApiError(400, "Validation Error", errors.array()));
  }
  const admin = req.user
  if (admin.role !== "admin") {
    return res.status(403).json(new ApiError(403, null, "Only admin can register corporate Admin!"));
  }
  try {
    let profileImagePath;
    const newUser = req.body;
    const existingUser = await User.findOne({ email: newUser.email })
    if (existingUser) {
      return res.status(400).json(new ApiResponse(400, null, "Email already exists!"));
    }
    if (req?.file?.path) profileImagePath = convertPathToUrl(req.file.path);
    const adminUser = new User({
      ...newUser,
      profileImage: profileImagePath ? profileImagePath : "",
      role: "corp-admin"
    });
    await adminUser.save();
    const token = generateSixDigitNumber();
    const passwordObject = await PasswordReset.create({
      userId: adminUser._id,
      token: token
    });
    const link = `${process.env.FRONTEND_URL}/secure-create-password?token=${token}`
    const name = `${adminUser?.firstName} ${adminUser?.lastName}`
    sendPwdCreationLink(adminUser.email, name, link)
    return res.status(200).json(new ApiResponse(200, adminUser, "Corporate user register successfully!"));
  } catch (error) {
    console.error(error);
    res.status(500).json(new ApiError(500, null, error.message));
  }
})
const createPassword = asyncHandler(async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    const { password } = req.body;
    const passwordReset = await PasswordReset.findOne({ token });
    if (!passwordReset) {
      return res
        .status(404)
        .json(new ApiError(404, null, "Password reset token expired or in valid!"));
    }
    const user = await User.findById(passwordReset.userId);
    if (!user) {
      return res
        .status(404)
        .json(new ApiError(404, null, "User not found!"));
    }
    user.password = password;
    user.isEmailVerified = true;
    await user.save();
    await PasswordReset.findByIdAndDelete(passwordReset._id);
    let { accessToken, refreshToken } = await createAccessOrRefreshToken(
      user._id
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
            user
          },
          "Password reset successfully!"
        )
      );
  } catch (error) {
    console.error(error)
    res.status(500).json(new ApiError(500, null, "Something went wrong while resetting password!"));
  }
});

const getCorpAdminList = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;
  try {
    const adminList = await User.find({ role: 'corp-admin' }).populate("organizationId").select('-password -refreshToken')
      .skip(skip)
      .limit(limitNumber);
    const totalCorpAdmin = await User.countDocuments({ role: 'corp-admin' })
    const formattedAdmin = adminList.map((admin) => {
      return {
        _id: admin._id,
        name: `${admin.firstName} ${admin.lastName}`,
        email: admin.email,
        mobile: admin.mobile,
        organizationName: admin.organizationId ? admin.organizationId.name : null,
        isActive: admin.isActive,
      }
    })

    return res.status(200).json(new ApiResponse(200, {
      pagination: {
        totalItems: totalCorpAdmin,
        totalPages: Math.ceil(totalCorpAdmin / limitNumber),
        currentPage: pageNumber,
        itemsPerPage: limitNumber,
      },
      result: formattedAdmin,
    }, "Admin List fatched successfully!"));

  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError(500, "", "Server error"));
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
  const userId = req.params.userId;

  if (!userId) {
    return res.status(401).json(new ApiError(401, "", "User not authenticated"));
  }

  const userData = req.body;
  let profileImage = req.file ? req.file.path : "";

  try {
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json(new ApiError(404, "", "User not found"));
    }

    if (existingUser.profileImage && profileImage) {
      if (fs.existsSync(existingUser.profileImage)) {
        await fs.promises.unlink(existingUser.profileImage);
      }
    }
    const updatedData = profileImage ? { ...userData, profileImage } : userData;

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    }).select("-password -refreshToken")

    if (!updatedUser) {
      return res.status(404).json(new ApiError(404, "", "User not found"));
    }


    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "User updated successfully"));
  } catch (error) {
    console.error("Error updating user profile:", error);
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
    role = 'corp-user',
    startDate,
    endDate,
    sortkey = "createdAt",
    sortdir = "desc",
  } = req.query;
  let orgId;
  if (user.role === "admin") {
    orgId = req.query.orgId;
  } else if (user.role === "corp-admin") {
    orgId = user.organizationId
  }
  // Pagination
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  // Search and Date Filter
  let filter = {};
  if (orgId) {
    filter.organizationId = new mongoose.Types.ObjectId(orgId);
  }
  if (role) {
    filter.role = role;
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
  try {
    const userList = await User.find(filter)
      .select("-password -refreshToken").populate("organizationId", "name")
      .sort({ [sortkey]: sortdir === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(limitNumber);
    if (!userList) {
      return res
        .status(400)
        .json(new ApiError(404, "", "User list fetching failed!"));
    }
    const flattendData = userList.map((user) => {
      return {
        _id: user._id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        name: `${user.firstName} ${user.lastName}`,
        mobile: user.mobile,
        role: user.role,
        organizationName: user.organizationId?.name || "",
        createdAt: user.createdAt,
        isActive: user.isActive

      }
    })
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
          result: flattendData,
        },
        "User list fetched successfully"
      )
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json(new ApiError(500, null, error.message));
  }
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
const getUserDetails = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne(
      { _id: id, role: { $in: ["corp-user", "corp-admin"] } },
      {
        _id: 1,
        role: 1,
        organizationId: 1,
        profileImage: 1,
        dateOfBirth: 1,
        email: 1,
        mobile: 1,
        lastName: 1,
        firstName: 1,
        gender: 1,
        country: 1,
        city: 1,
        state: 1,
        isEmailVerified: 1,
        isMobileVerified: 1,
        isActive: 1,
      }
    ).populate("organizationId", "name")
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const formattedUser = {
      _id: user._id,
      role: user.role,
      organizationId: user.organizationId?._id,
      profileImage: user?.profileImage,
      dateOfBirth: user.dateOfBirth,
      email: user.email,
      mobile: user.mobile,
      lastName: user.lastName,
      firstName: user.firstName,
      gender: user.gender,
      country: user.country,
      city: user.city,
      state: user.state,
      isEmailVerified: user.isEmailVerified,
      isMobileVerified: user.isMobileVerified,
      organizationName: user.organizationId?.name,
      isActive: user.isActive
    }
    res.status(200).json(new ApiResponse(200, formattedUser, "Data fatched successfully"));
  } catch (error) {
    console.error("Error fetching admin user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the user by ID and check the role
  const user = await User.findOne({
    _id: id,
    role: { $in: ["corp-user", "corp-admin"] }
  });

  // Check if the user exists
  if (!user) {
    return res.status(404).json(new ApiError(404, null, "No user found!"));
  }

  // Delete the user
  await user.deleteOne(); // Use deleteOne() for Mongoose

  // Respond with success
  res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
});
const corpAdminDashboard = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    if (user.role !== 'corp-admin') {
      return res.status(403).json(new ApiResponse(403, null, "Unauthorized Access"));
    }
    const organization = await Organization.findById(user.organizationId).select('name');

    // Aggregate query for users and package distribution
    const users = await User.aggregate([
      {
        $match: {
          role: "corp-user",
          organizationId: user.organizationId,
        },
      },
      {
        $lookup: {
          from: "packagedistributions",
          localField: "_id",
          foreignField: "userId",
          as: "packageDistribution",
        },
      },
      {
        $unwind: {
          path: "$packageDistribution",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          fullName: { $concat: ["$firstName", " ", "$lastName"] },
          email: 1,
          packageDisId: "$packageDistribution._id",
          sesAllotted: { $ifNull: ["$packageDistribution.sesAllotted", 0] },
          sesUsed: { $ifNull: ["$packageDistribution.used", 0] },
        },
      },
      { $skip: skip },
      { $limit: limitNumber },
    ]);

    const totalUsers = await User.countDocuments({
      role: "corp-user",
      organizationId: user.organizationId,
    });

    // Aggregate package details for the organization
    const packageDetails = await CorpPackage.aggregate([
      {
        $match: { organizationId: user.organizationId },
      },
      {
        $group: {
          _id: "$_id",
          remainingSession: { $sum: "$remainingSessions" },
          totalSession: { $sum: "$TotalSession" },
        },
      },
    ]);

    // Default package data if no packages found
    const packageData = packageDetails.length > 0 ? packageDetails[0] : { remainingSession: 0, totalSession: 0 };

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          result: {
            organizationName: organization.name,
            email: user.email,
            packageId: packageData._id || "",
            remainingSession: packageData.remainingSession,
            totalSession: packageData.totalSession,
          },
          userList: users,
          totalUsers,
          pagination: {
            currentPage: pageNumber,
            totalPages: Math.ceil(totalUsers / limitNumber),
            totalItems: totalUsers,
            itemsPerPage: limitNumber,
          },
        },
        "Dashboard data retrieved successfully"
      )
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json(new ApiResponse(500, null, "Internal server error"));
  }
});


const verifyTokenUrl = asyncHandler(async (req, res) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  const passwordReset = await PasswordReset.findOne({ token });
  if (!passwordReset) {
    return res
      .status(404)
      .json(new ApiError(404, null, "expired"));
  }
  const user = await User.findById(passwordReset.userId);
  if (!user) {
    return res
      .status(404)
      .json(new ApiError(404, null, "User not found!"));
  }
  return res.status(200).json(new ApiResponse(200, { email: user.email, name: `${user.firstName} ${user.lastName}` }));
})

const sendUrlManully = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  if (!isValidObjectId(userId)) {
    return res.status(400).json(new ApiError(400, null, "Invalid user ID"));
  }
  const user = await User.findById(userId);
  if (!user) {
    return res
      .status(404)
      .json(new ApiError(404, null, "User not found!"));
  }
  const token = generateSixDigitNumber();
  const passwordObject = await PasswordReset.create({
    userId: userId,
    token: token
  });
  const link = `${process.env.FRONTEND_URL}/secure-create-password?token=${token}`
  const name = `${user?.firstName} ${user?.lastName}`
  sendPwdCreationLink(user.email, name, link)
  console.log(link)
  return res.status(200).json(new ApiResponse(200, null, `password reset link has been sent to ${user.email}`))
})

const moreSessionRequest = asyncHandler(async (req, res) => {
  const user = req.user;
  if (user.role !== 'corp-admin') {
    return res.status(403).json(new ApiResponse(403, null, "Unauthorized Access"));
  }
  const company = await Organization.findById(user.organizationId)
  if (!company) {
    return res.status(404).json(new ApiResponse(404, null, "Company not found"));
  }
  const emailContent = reqForMoreSession(company.name, `${user.firstName}.${user.lastName}`, user.email, user.mobile)
  const subject = "Request for more corporate sessions"
  sendMail('bhavesh.kapoor@unificars.com', subject, emailContent);
  return res.status(200).json(new ApiResponse(200, null, "Request sent successfully"));
})
export { validateRegister, registerUser, corpAdminlogin, registerAdmin, corpUserlogin, updateProfile, allUser, allUserBycompany, getOrganizationAdmin, createPassword, getCorpAdminList, getUserDetails, deleteUser, corpAdminDashboard, verifyTokenUrl, sendUrlManully, moreSessionRequest }
