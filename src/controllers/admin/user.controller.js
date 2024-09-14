import fs from "fs";
import jwt from "jsonwebtoken";
import PDFDocument from "pdfkit";
import { process } from "uniqid";
import ApiError from "../../utils/ApiError.js";
import { verifyOTP } from "../otpController.js";
import { User } from "../../models/userModel.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { parseISO, addDays, startOfDay, endOfDay } from "date-fns";
import { sendOtpMessage } from "../../config/msg91.config.js";
import { createAndStoreMobileOTP } from "../otpController.js";
import { otpContent } from "../../static/emailcontent.js";
import { welcomeEmail } from "../../static/emailcontent.js";
import { transporter, mailOptions } from "../../config/nodeMailer.js";
import { check, validationResult } from "express-validator";

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
  const verify = await verifyOTP(email, otp)
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
export const generateInvoice = asyncHandler(async (req, res) => {
  const {
    user,
    date,
    items,
    total,
    transactionId,
    paymentMethod,
    billingAddress,
    shippingAddress,
  } = req.body;

  const doc = new PDFDocument();

  let filename = `invoice_${transactionId}.pdf`;

  // Response headers to download the PDF
  res.setHeader("Content-disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-type", "application/pdf");

  // Company logo and title
  doc.image("src/logo/logo.png", 50, 50, { width: 160 });
  doc.fontSize(16).text("Transaction Invoice", 200, 50, { align: "right" });
  doc.fontSize(14).text(`#${transactionId}`, 200, 75, { align: "right" });

  // Horizontal line
  doc.moveTo(50, 120).lineTo(550, 120).stroke();

  // Company and Customer details
  doc.fontSize(12).text("Company Name", 50, 140);
  doc.text("123 Business Road, Suite 100", 50, 155);
  doc.text("Business City, BC 54321", 50, 170);
  doc.text("Email: contact@company.com", 50, 185);
  doc.text("Phone: (123) 456-7890", 50, 200);

  doc.text("Customer:", 350, 140);
  doc.text(`${user.name}`, 350, 155);
  doc.text(`${user.email}`, 350, 170);
  doc.text(`${billingAddress}`, 350, 185);

  // Invoice date and payment method
  doc.text(`Invoice Date: ${date}`, 50, 220);
  doc.text(`Payment Method: ${paymentMethod}`, 50, 235);

  // Billing and Shipping Address
  doc.text(`Billing Address: ${billingAddress}`, 50, 260);
  doc.text(
    `Shipping Address: ${shippingAddress || "Same as billing address"}`,
    50,
    280
  );

  // Horizontal line
  doc.moveTo(50, 300).lineTo(550, 300).stroke();

  // Table header
  doc.moveDown().fontSize(14).text("Items:", 50, 320);
  doc.fontSize(12);
  doc.text("Item", 50, 350);
  doc.text("Quantity", 300, 350);
  doc.text("Unit Price", 400, 350);
  doc.text("Subtotal", 500, 350);

  // Horizontal line
  doc.moveTo(50, 370).lineTo(550, 370).stroke();

  // Table rows
  let yPos = 390;
  items.forEach((item) => {
    const subtotal = (item.quantity * item.price).toFixed(2);
    doc.text(item.name, 50, yPos);
    doc.text(item.quantity, 300, yPos);
    doc.text(`$${item.price.toFixed(2)}`, 400, yPos);
    doc.text(`$${subtotal}`, 500, yPos);
    yPos += 20;
  });

  // Total
  doc
    .moveTo(50, yPos + 10)
    .lineTo(550, yPos + 10)
    .stroke();
  doc.fontSize(14).text(`Total: $${total}`, 500, yPos + 20);

  // Horizontal line
  doc
    .moveTo(50, yPos + 40)
    .lineTo(550, yPos + 40)
    .stroke();

  // Footer: Thank you note or additional information
  // doc.fontSize(10).text("Thank you for your business!", 50, yPos + 60);

  // Pipe the output to response
  doc.pipe(res);
  doc.end();
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
