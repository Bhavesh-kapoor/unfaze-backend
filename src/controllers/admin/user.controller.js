import fs from "fs";
import jwt from "jsonwebtoken";
import PDFDocument from "pdfkit";
import { process } from "uniqid";
import ApiError from "../../utils/ApiError.js";
import { verifyOTP } from "../otpController.js";
import { User } from "../../models/userModel.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { parseISO, addDays, startOfDay, endOfDay, format } from "date-fns";
import { sendOtpMessage } from "../../config/msg91.config.js";
import { createAndStoreOTP } from "../otpController.js";
import { otpContent } from "../../static/emailcontent.js";
import {
  welcomeEmail,
  passwordUpdatedEmail,
} from "../../static/emailcontent.js";
import { transporter, mailOptions } from "../../config/nodeMailer.js";
import { check, validationResult } from "express-validator";
import { Transaction } from "../../models/transactionModel.js";

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
  try {
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

const register = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json(new ApiError(400, "Validation Error", errors.array()));
  }
  const verify = await verifyOTP(email, otp);
  if (!verify) {
    return res.status(201).json(new ApiError(201, "", "Invalid OTP"));
  }

  // let profileImage = req.file ? req.file.path : "";
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
  const htmlContent = welcomeEmail(
    `${req.body.firstName} ${req.body.lastName}`
  );
  const Emailoptions = mailOptions(email, "Welcome to Unfazed!", htmlContent);
  transporter.sendMail(Emailoptions, (error, info) => {
    if (error) {
      console.log(error);
    }
    console.log("welcome mail sent: %s", info.messageId);
  });
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

export const getUserDetails = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne(
      { _id: id, role: "user" },
      {
        _id: 1,
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
      }
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
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
    const { email } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, null, "You are not associated with any Account!")
        );
    }
    const otp = await createAndStoreOTP(email);
    const htmlContent = otpContent(otp);
    const options = mailOptions(
      user.email,
      "Email verification code - Unfazed",
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
      .json(new ApiResponse(200, null, "OTP sent on your registered Email"));
  } catch (error) {
    console.log(error);
    return res.status(500).json(new ApiError(500, error, "Error sending OTP"));
  }
});
const verifyOtpAllowAccess = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  try {
    const isVeried = await verifyOTP(email, otp);
    if (!isVeried) {
      return res.status(201).json(new ApiError(201, "", "Invalid OTP"));
    }
    const user = await User.findOne({ email: email }).select(
      "-password -refreshToken"
    );
    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "Invalid email"));
    }
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
            user: user,
          },
          "User verified!"
        )
      );
  } catch (error) {
    console.log(error);
    res.status(500).json(new ApiError(500, error, "failed to verify OTP"));
  }
});
const setNewPasswrd = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;
    const { password } = req.body;
    const user = await User.findById(userId);
    user.password = password;
    await user.save({ validateBeforeSave: false });

    user.password = null;
    user.refreshToken = null;
    // let { accessToken, refreshToken } = await createAccessOrRefreshToken(
    //   user._id
    // );
    // const options = {
    //   httpOnly: true,
    //   secure: true,
    // };
    const htmlContent = passwordUpdatedEmail(
      `${user?.firstName} ${user?.lastName}`
    );
    const Emailoptions = mailOptions(
      user?.email,
      "Password recovery email",
      htmlContent
    );
    transporter.sendMail(Emailoptions, (error, info) => {
      if (error) {
        console.log(error);
      }
      console.log("mail sent: %s", info.messageId);
    });
    user.password = null;
    user.refreshToken = null;
    return res
      .status(200)
      .json(new ApiResponse(200, user, "password updated successfully"));
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error });
  }
});
const generateInvoice = asyncHandler(async (req, res) => {
  const { transactionId } = req.body;

  const projectedFields = {
    user: 1,
    rate_USD: 1,
    updatedAt: 1,
    amount_USD: 1,
    start_time: 1,
    amount_INR: 1,
    transactionId: 1,
  };
  const projectedUserFields = {
    _id: 0,
    city: 1,
    email: 1,
    state: 1,
    gender: 1,
    country: 1,
    lastName: 1,
    firstName: 1,
  };

  let data = await Transaction.aggregate([
    { $match: { transactionId: transactionId } },
    {
      $lookup: {
        from: "therapists",
        localField: "therapist_id",
        foreignField: "_id",
        pipeline: [{ $project: { firstName: 1, lastName: 1, _id: 0 } }],
        as: "therapist_details",
      },
    },
    { $unwind: "$therapist_details" },
    {
      $lookup: {
        from: "specializations",
        localField: "category",
        foreignField: "_id",
        pipeline: [{ $project: { name: 1, _id: 0 } }],
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        pipeline: [{ $project: { ...projectedUserFields } }],
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        ...projectedFields,
        category: "$category.name",
        therapistName: {
          $concat: [
            "$therapist_details.firstName",
            " ",
            "$therapist_details.lastName",
          ],
        },
      },
    },
  ]);

  if (!data) return response.json({ message: "Something is wrong!" });

  data = data[0];

  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  let filename = `invoice_${data?.transactionId}.pdf`;

  // Response headers to download the PDF
  res.setHeader("Content-disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-type", "application/pdf");

  // Add logo and Invoice header
  doc.image("src/logo/logo.png", 50, 50, { width: 120 });
  doc.fontSize(26).text("Invoice", 450, 65, { align: "right" }).fontSize(12);

  // Horizontal line
  doc.moveTo(50, 100).lineTo(550, 100).stroke();

  // Company Details
  doc
    .fontSize(10)
    .text("From", 50, 110)
    .fontSize(10)
    .text("UNFAZED THERAPY SOLUTIONS", 50, 125)
    .fontSize(10)
    .text("PRIVATE LIMITED", 50, 140)
    .text("Nri City Township,", 50, 155)
    .text("Kanpur Nagar, Uttar Pradesh,", 50, 170)
    .text("India - 208002", 50, 185);

  // Client (Customer) Details
  doc
    .fontSize(10)
    .text("To", 50, 220)
    .fontSize(12)
    .text(`${data?.user?.firstName} ${data?.user?.lastName}`, 50, 235)
    .fontSize(10)
    .text(
      `${data?.user?.city}, ${data?.user?.state}, ${data?.user?.country}`,
      50,
      250
    )
    .text(`Email-ID: ${data?.user?.email}`, 50, 265);

  const formattedDate = format(data?.updatedAt, "MMM dd, yyyy");
  const formattedStartDate = format(data?.start_time, "MMM dd, yyyy hh:mm a");

  doc
    .fontSize(12)
    .text(`Invoice No.: #${data?.transactionId.slice(-8)}`, 350, 120, {
      align: "right",
    })
    .text(`Invoice Date: ${formattedDate}`, 350, 140, {
      align: "right",
    });
  // .text(`Payment Mode: ${paymentMethod}`, 350, 160, { align: "right" });

  // Product/Service Details Header
  doc
    .fontSize(12)
    .fillColor("#000000")
    .text("Product Details", 50, 300)
    .moveDown();

  // Table Headers
  doc
    .fontSize(12)
    .rect(50, 320, 500, 60)
    .fill("#FFE5D3")
    .fillColor("black")
    .text("Name", 70, 330)
    .text("Therapist Name", 200, 330)
    .text("Time Slot", 350, 330)
    .text("Price", 480, 330);

  // Horizontal line
  // doc.moveTo(50, 320).lineTo(550, 320).stroke();

  // Product/Service Details
  const amount = data?.amount_INR ? data.amount_INR : data?.amount_USD;
  doc
    .fontSize(10)
    .text(`${data?.category}`, 70, 360)
    .text(`${data?.therapistName}`, 200, 360)
    .text(`${formattedStartDate}`, 350, 360)
    .text(`Rs. ${amount}`, 480, 360);

  // Horizontal line
  // doc.moveTo(50, 350).lineTo(550, 350).stroke();

  // Horizontal line
  // doc.moveTo(50, 380).lineTo(550, 380).stroke();

  // Pricing Details
  doc
    .fontSize(16)
    .text(`Total: ${data?.amount_USD ? "$" : "Rs."} ${amount}/-`, 400, 400);

  // Pipe the output to response
  doc.pipe(res);
  doc.end();
});

export {
  allUser,
  register,
  userlogin,
  adminlogin,
  refreshToken,
  updateAvatar,
  updateProfile,
  forgotPassword,
  verifyOtpAllowAccess,
  getCurrentUser,
  validateRegister,
  changeCurrentPassword,
  generateInvoice,
  setNewPasswrd,
};
