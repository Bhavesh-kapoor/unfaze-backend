import fs from "fs";
import mongoose, { Types } from "mongoose";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { Session } from "../../models/sessionsModel.js";
import { startOfMonth, endOfMonth, min } from "date-fns";
import { Therapist } from "../../models/therapistModel.js";
import { check, validationResult } from "express-validator";
import { sendNotification } from "../notificationController.js";
import { loginCredentialEmail } from "../../static/emailcontent.js";
import { transporter, mailOptions } from "../../config/nodeMailer.js";
import { generateTempPassword } from "../../utils/tempPasswordGenerator.js";
import { verifyOTP, createAndStoreOTP } from "../otpController.js";
import { otpContent, passwordUpdatedEmail } from "../../static/emailcontent.js";
import { CustomerFeedback } from "../../models/reviewsModal.js";
import { Course } from "../../models/courseModel.js";
import { count, log } from "console";
import { json } from "express";
import { ObjectId } from "mongodb";
import path from "path";
import { pipeline } from "stream";
import { stringify } from "querystring";
import { all } from "axios";
import { populate } from "dotenv";
const createAccessOrRefreshToken = async (user_id) => {
  const user = await Therapist.findById(user_id);
  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

const validateRegister = [
  check("email", "Email is required").isEmail(),
  check("gender", "Gender is required").notEmpty(),
  check("mobile", "Mobile is required").notEmpty(),
  check("lastName", "Last Name is required").notEmpty(),
  check("firstName", "First Name is required").notEmpty(),
  check("dateOfBirth", "Date Of Birth is required").notEmpty(),
  check("specialization", "Specialization is required").notEmpty(),
];

export const convertPathToUrl = (filePath) => {
  const trimmedPath = filePath.replace(/src[\\/]/, "").replace(/\\/g, "/");
  const baseUrl = process.env.APP_BASE_URL;
  return `${baseUrl}/${trimmedPath}`;
};

const register = asyncHandler(async (req, res) => {
  try {
    const {
      bio,
      email,
      mobile,
      gender,
      license,
      usdPrice,
      inrPrice,
      lastName,
      panNumber,
      firstName,
      experience,
      highSchool,
      graduation,
      adharNumber,
      dateOfBirth,
      socialMedia,
      bankDetails,
      intermediate,
      postGraduation,
      addressDetails,
      languages = [],
      specialization = [],
    } = req.body;

    // Check if therapist already exists by email or mobile
    const existingTherapist = await Therapist.findOne({
      $or: [{ email }, { mobile }],
    });

    if (existingTherapist) {
      const duplicateField =
        existingTherapist?.email === email
          ? "Email"
          : existingTherapist?.mobile === mobile
            ? "Phone Number"
            : "";

      return res
        .status(400)
        .json(new ApiError(400, `${duplicateField} already exists.`));
    }
    const therapistData = {
      bio,
      email,
      mobile,
      gender,
      license,
      usdPrice,
      inrPrice,
      lastName,
      firstName,
      panNumber,
      languages,
      experience,
      dateOfBirth,
      adharNumber,
      bankDetails,
      socialMedia,
      specialization,
      addressDetails,
      educationDetails: {
        highSchool,
        graduation,
        intermediate,
        postGraduation,
      },
    };

    // Handle file uploads
    if (req.files?.profileImage) {
      therapistData.profileImageUrl = convertPathToUrl(
        req.files.profileImage[0]?.path
      );
    }
    if (req.files?.highschoolImg) {
      therapistData.educationDetails.highSchool.certificateImageUrl =
        convertPathToUrl(req.files.highschoolImg[0]?.path);
    }
    if (req.files?.intermediateImg) {
      therapistData.educationDetails.intermediate.certificateImageUrl =
        convertPathToUrl(req.files.intermediateImg[0]?.path);
    }
    if (req.files?.graduationImg) {
      therapistData.educationDetails.graduation.certificateImageUrl =
        convertPathToUrl(req.files.graduationImg[0]?.path);
    }
    if (req.files?.postGraduationImg) {
      therapistData.educationDetails.postGraduation.certificateImageUrl =
        convertPathToUrl(req.files.postGraduationImg[0]?.path);
    }

    // Create and save the therapist
    const newTherapist = new Therapist(therapistData);
    await newTherapist.save();

    // Send email to therapist if an admin is registering
    if (req.user) {
      const password = generateTempPassword();
      const subject =
        "Your Unfazed Account is Ready: Login Information Enclosed";
      const htmlContent = loginCredentialEmail(email, password);
      const emailOptions = mailOptions(email, subject, htmlContent);

      transporter.sendMail(emailOptions, (error, info) => {
        if (error) {
          console.error("Error while sending email:", error);
        } else {
          console.log("Email sent successfully:", info.response);
        }
      });
    }

    // Return successful response
    res
      .status(200)
      .json(
        new ApiResponse(200, newTherapist, "Therapist created successfully")
      );
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json(new ApiError(500, "Internal Server Error", err.message));
  }
});

const login = asyncHandler(async (req, res) => {
  const { email, mobile, password } = req.body;
  if (!email && !mobile) {
    return res
      .status(409)
      .json(new ApiError(400, "", "Please pass email or mobile"));
  }

  let existUser = await Therapist.findOne({ $or: [{ email }, { mobile }] });
  if (!existUser)
    return res.status(404).json(new ApiError(400, "", "user not found"));
  if (!existUser.isActive) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          "Your account is inactive pleae contact to admin."
        )
      );
  }

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

  const LoggedInUser = await Therapist.findById(existUser._id).select(
    "-password -refreshToken"
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

export const getTherapistSpecialization = asyncHandler(
  async (request, response) => {
    try {
      const { therapist_id, specialization_id, course_id } = request.body;

      if (!therapist_id) {
        return response
          .status(400)
          .json(
            new ApiError(400, "Therapist id and specialization id required!")
          );
      }

      const therapist = await Therapist.findById(therapist_id, {
        _id: 1,
        ratings: 1,
        sessionCount: 1,
        bio: 1,
        educationDetails: 1,
        lastName: 1,
        languages: 1,
        firstName: 1,
        addressDetails: 1,
        profileImageUrl: 1,
        inrPrice: 1,
        usdPrice: 1,
      }).populate({
        path: "specialization",
        select: "name usdPrice inrPrice",
      });
      if (!therapist) {
        return response
          .status(404)
          .json(new ApiError(404, "Therapist not found!"));
      }
      let specialization = {};
      if (specialization_id) {
        specialization = therapist.specialization.find(
          (item) => item._id.toString() === specialization_id.toString()
        );
        if (!specialization) {
          return response
            .status(404)
            .json(new ApiError(404, "Specialization not found!"));
        }
      }

      delete therapist.specialization;
      const reviews = await CustomerFeedback.aggregate([
        { $match: { therapist: therapist._id } },
        { $match: { isActive: true } },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
            as: "userDetails",
          },
        },
        { $unwind: "$userDetails" },
        {
          $project: {
            _id: 1,
            rating: 1,
            review: 1,
            userName: {
              $concat: ["$userDetails.firstName", " ", "$userDetails.lastName"],
            },
          },
        },
      ]);
      let result;
      if (course_id) {
        const course = await Course.findOne({ _id: course_id }).populate(
          "specializationId",
          "name"
        );
        const flattenedCourses = {
          _id: course?._id,
          usdPrice: course?.usdPrice,
          inrPrice: course?.inrPrice,
          isActive: course?.isActive,
          sessionOffered: course?.sessionOffered,
          sessionName: course?.specializationId?.name,
        };
        result = {
          therapist,
          specialization,
          reviews,
          course: flattenedCourses,
        };
      } else {
        result = {
          therapist,
          specialization,
          reviews,
          course: {},
        };
      }
      return response
        .status(200)
        .json(new ApiResponse(200, result, "Data fetched successfully"));
    } catch (error) {
      console.error(error);
      response.status(500).json(new ApiError(500, "Server Error"));
    }
  }
);

const logout = asyncHandler(async (req, res) => {
  await Therapist.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const activateOrDeactivate = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  if (!_id) {
    return res.status(400).json(new ApiError(400, "Therapist id required!"));
  }

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json(new ApiError(400, "Invalid Object Id"));
  }

  // Mark active or deactivate
  const therapist = await Therapist.findById(_id);
  if (!therapist) {
    return res.status(400).json(new ApiError(400, "Therapist not found!"));
  }
  const password = generateTempPassword();
  const subject = "Your Unfazed Account is Ready: Login Information Enclosed";
  const htmlContent = loginCredentialEmail(therapist.email, password);
  const EmailOptions = mailOptions(therapist.email, subject, htmlContent);
  transporter.sendMail(EmailOptions, (error, info) => {
    if (error) {
      console.log("Error while sending email:", error);
    } else {
      console.log("Email sent successfully:", info.response);
    }
  });

  therapist.isActive = !therapist.isActive;
  therapist.password = password;
  await therapist.save();
  let activeStatus = "";
  if (therapist.isActive) {
    activeStatus = "active";
  } else {
    activeStatus = "deactive";
  }
  const receiverId = _id;
  const receiverType = "Therapist";
  const message = `your profile marked ${activeStatus}`;
  const payload = {};
  sendNotification(receiverId, receiverType, message, payload)
    .then((notification) => {
      console.log("Notification sent:", notification);
    })
    .catch((err) => {
      console.error("Error sending notification:", err);
    });
  return res
    .status(200)
    .json(
      new ApiResponse(200, therapist, "Active status updated successfully!")
    );
});

const therapistList = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortkey = "createdAt",
    sortdir = "desc",
    search,
  } = req.query;
  // email,mobile,specialization,
  //add is active filter
  /*---------------------------- Pagination ------------------------------*/
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;
  let pipeline = [
    {
      $lookup: {
        from: "specializations",
        localField: "specialization",
        foreignField: "_id",
        as: "specializationDetails",
      },
    },
  ];
  if (search)
    pipeline = [
      ...pipeline,
      {
        $match: {
          $or: [
            { email: { $regex: search, $options: "i" } },
            { mobile: { $regex: search, $options: "i" } },
            { "specializationDetails.name": { $regex: search, $options: "i" } },
          ],
        },
      },
    ];

  const therapistListData = await Therapist.aggregate([
    ...pipeline,
    { $sort: { [sortkey]: sortdir === "desc" ? -1 : 1 } },
    { $skip: skip },
    { $limit: limitNumber },
    {
      $project: {
        _id: 1,
        profileImage: 1,
        name: { $concat: ["$firstName", " ", "$lastName"] },
        email: 1,
        isEmailVerified: 1,
        isActive: 1,
        createdAt: 1,
        mobile: 1,
        specializationDetails: {
          $map: {
            input: "$specializationDetails",
            as: "specialization",
            in: {
              _id: "$$specialization._id",
              name: "$$specialization.name",
            },
          },
        },
      },
    },
  ]);

  pipeline.push({ $count: "totalCount" });
  const countResult = await Therapist.aggregate(pipeline);
  const totalTherapists =
    countResult.length > 0 ? countResult[0].totalCount : 0;

  if (!therapistListData.length) {
    return res.status(404).json(new ApiError(404, "", "No therapists found!"));
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        pagination: {
          totalItems: totalTherapists,
          totalPages: Math.ceil(totalTherapists / limitNumber),
          currentPage: pageNumber,
          itemsPerPage: limitNumber,
        },
        result: therapistListData,
      },
      "Therapist list fetched successfully"
    )
  );
});

const getTherepistById = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  let Therepist = await Therapist.findOne({ _id });
  res
    .status(200)
    .json(new ApiResponse(200, Therepist, "Therepist found Successfully!"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateTherapist = asyncHandler(async (req, res) => {
  let _id = req.user?._id;
  if (req.body?._id) _id = req.body?._id;
  const {
    bio,
    email,
    mobile,
    gender,
    license,
    lastName,
    usdPrice,
    inrPrice,
    isActive,
    languages,
    firstName,
    panNumber,
    experience,
    highSchool,
    graduation,
    adharNumber,
    dateOfBirth,
    socialMedia,
    bankDetails,
    intermediate,
    specialization,
    addressDetails,
    postGraduation,
    serviceChargeInr,
    serviceChargeUsd,
  } = req.body;

  try {
    const existingTherapist = await Therapist.findById(_id).lean();
    if (!existingTherapist) {
      return res.status(404).json(new ApiError(404, "", "Therapist not found"));
    }

    const therapistData = {
      bio: bio || existingTherapist.bio,
      email: email || existingTherapist.email,
      gender: gender || existingTherapist.gender,
      mobile: mobile || existingTherapist.mobile,
      license: license || existingTherapist.license,
      isActive: isActive || existingTherapist.isActive,
      lastName: lastName || existingTherapist.lastName,
      panNumber: panNumber || existingTherapist.panNumber,
      languages: languages || existingTherapist.languages,
      firstName: firstName || existingTherapist.firstName,
      experience: experience || existingTherapist.experience,
      adharNumber: adharNumber || existingTherapist.adharNumber,
      bankDetails: bankDetails || existingTherapist.bankDetails,
      socialMedia: socialMedia || existingTherapist.socialMedia,
      dateOfBirth: dateOfBirth || existingTherapist.dateOfBirth,
      addressDetails: addressDetails || existingTherapist.addressDetails,
      specialization: specialization || existingTherapist.specialization,
      usdPrice: usdPrice !== undefined ? usdPrice : existingTherapist.usdPrice,
      inrPrice: inrPrice !== undefined ? inrPrice : existingTherapist.inrPrice,
      serviceChargeUsd:
        serviceChargeUsd !== undefined
          ? serviceChargeUsd
          : existingTherapist.serviceChargeUsd,
      serviceChargeInr:
        serviceChargeInr !== undefined
          ? serviceChargeInr
          : existingTherapist.serviceChargeInr,
      educationDetails: {
        highSchool: {
          ...existingTherapist.educationDetails?.highSchool || {},
          ...highSchool,
        },
        intermediate: {
          ...existingTherapist.educationDetails?.intermediate || {},
          ...intermediate,
        },
        graduation: {
          ...existingTherapist.educationDetails?.graduation || {},
          ...graduation,
        },
        postGraduation: {
          ...existingTherapist.educationDetails?.postGraduation || {},
          ...postGraduation,
        },
      },
    };

    if (req.files?.profileImage) {
      therapistData.profileImageUrl = convertPathToUrl(
        req.files.profileImage[0]?.path
      );
    }

    if (req.files?.highschoolImg) {
      therapistData.educationDetails.highSchool.certificateImageUrl =
        convertPathToUrl(req.files.highschoolImg[0]?.path);
    }

    if (req.files?.intermediateImg) {
      therapistData.educationDetails.intermediate.certificateImageUrl =
        convertPathToUrl(req.files.intermediateImg[0]?.path);
    }

    if (req.files?.graduationImg) {
      therapistData.educationDetails.graduation.certificateImageUrl =
        convertPathToUrl(req.files.graduationImg[0]?.path);
    }

    if (req.files?.postGraduationImg) {
      therapistData.educationDetails.postGraduation.certificateImageUrl =
        convertPathToUrl(req.files.postGraduationImg[0]?.path);
    }

    const updatedTherapist = await Therapist.findByIdAndUpdate(
      _id,
      therapistData,
      {
        new: true,
        select: "-password -refreshToken",
      }
    );

    res
      .status(200)
      .json(
        new ApiResponse(200, updatedTherapist, "Profile updated successfully")
      );
  } catch (err) {
    console.log(err);
    res.status(500).json(new ApiError(500, "", err.message));
  }
});

const updateAvatar = asyncHandler(async (req, res) => {
  const user_id = req.user?._id;
  if (!req.file) {
    return res
      .status(404)
      .json(new ApiError(404), "", " please select an image!");
  }
  const currentUser = await Therapist.findOne({ _id: user_id });
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

export const deleteTherapistByID = asyncHandler(async (req, res) => {
  const therapistID = req.params._id;
  if (!mongoose.Types.ObjectId.isValid(therapistID)) {
    return res
      .status(400)
      .json(new ApiError(400, "", "Invalid therapistID id"));
  }
  const deletedTherapist = await Therapist.findByIdAndDelete(therapistID);
  if (!deletedTherapist) {
    return res
      .status(200)
      .json(new ApiError(404, "", "error while deleting the Blog"));
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "", "Blog deleted successfully!"));
});

const dashboard = asyncHandler(async (req, res) => {
  const therapist = req.user;
  let therapist_id = therapist._id;
  const { id } = req.params;

  if (id) therapist_id = new mongoose.Types.ObjectId(id);
  if (!therapist_id) {
    return res.status(400).json({ message: "Therapist ID is required." });
  }

  try {
    const currentDate = new Date();
    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = min([endOfMonth(currentDate), currentDate]);

    const [result] = await Session.aggregate([
      {
        $match: { therapist_id: therapist_id },
      },
      {
        $lookup: {
          from: "therapistpays",
          localField: "category",
          foreignField: "specializationId",
          let: { therapistId: therapist_id },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$therapistId", "$$therapistId"] } },
            },
            {
              $project: {
                inrPay: 1,
                usdPay: 1,
              },
            },
          ],
          as: "therapist_pay",
        },
      },
      {
        $unwind: {
          path: "$therapist_pay",
          preserveNullAndEmptyArrays: true, // Allow missing pay data
        },
      },
      {
        $addFields: {
          inrPay: { $ifNull: ["$therapist_pay.inrPay", 0] },
          usdPay: { $ifNull: ["$therapist_pay.usdPay", 0] },
        },
      },
      {
        $lookup: {
          from: "specializations",
          localField: "category",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1 } }],
          as: "category_details",
        },
      },
      {
        $unwind: "$category_details",
      },
      {
        $lookup: {
          from: "therapists",
          localField: "therapist_id",
          foreignField: "_id",
          pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
          as: "therapist_details",
        }
      },
      { $unwind: "$therapist_details" },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
          as: "user_details",
        }
      },
      { $unwind: "$user_details" },
      {
        $facet: {
          earnings: [
            {
              $match: { status: "completed" },
            },
            {
              $group: {
                _id: null,
                amount_USD: { $sum: "$usdPay" },
                amount_INR: { $sum: "$inrPay" },
              },
            },
            {
              $project: { _id: 0 },
            },
          ],
          currentMonthEarnings: [
            {
              $match: {
                status: "completed",
                start_time: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
              },
            },
            {
              $group: {
                _id: null,
                amount_USD: { $sum: "$usdPay" },
                amount_INR: { $sum: "$inrPay" },
              },
            },
            {
              $project: { _id: 0 },
            },
          ],
          upcomingSessionCount: [
            {
              $match: {
                status: { $in: ["upcoming", "rescheduled"] },
              },
            },
            {
              $count: "count",
            },
          ],
          completedSessionCount: [
            {
              $match: { status: "completed" },
            },
            {
              $count: "count",
            },
          ],
          sessions: [
            {
              $match: { status: { $in: ["upcoming", "rescheduled"] } },
            },
            {
              $sort: { start_time: 1 },
            },
            { $limit: 2 },
            {
              $project: {
                transactionId: 1,
                createdAt: 1,
                userName: {
                  $concat: [
                    "$user_details.firstName",
                    " ",
                    "$user_details.lastName",
                  ],
                },
                therapistName: {
                  $concat: [
                    "$therapist_details.firstName",
                    " ",
                    "$therapist_details.lastName",
                  ],
                },
                category: "$category_details.name",
                status: 1,
                start_time: 1,
              },
            },
          ],
          overallSessionCountByCategory: [
            { $match: { status: "completed" } },
            {
              $group: {
                _id: "$category_details.name",
                count: { $sum: 1 },
              },
            },
          ],
          currentMonthSessionCountByCategory: [
            {
              $match: {
                status: "completed",
                start_time: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
              },
            },
            {
              $group: {
                _id: "$category_details.name",
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);
    // Handle empty earnings and session counts
    const amount = (result.earnings && result.earnings[0]) || {
      amount_USD: 0,
      amount_INR: 0,
    };
    const currentMonthEarnings = (result.currentMonthEarnings &&
      result.currentMonthEarnings[0]) || { amount_USD: 0, amount_INR: 0 };

    // Update upcoming session count
    const upcomingSessionCount = (result.upcomingSessionCount[0]?.count || 0);
    const completedSessionCount = (result.completedSessionCount[0]?.count || 0);
    const sessions = result.sessions || [];

    // Add the category session counts
    const sessionCountByCategory = result.overallSessionCountByCategory.map(category => ({
      category: category._id,
      count: category.count,
    }));
    const currentMonthSessionCountByCategory = result.currentMonthSessionCountByCategory.map(category => ({
      category: category._id,
      count: category.count,
    }));

    // Return the result
    return res.status(200).json({
      amount,
      currentMonthEarnings,
      completedSessionCount,
      upcomingSessionCount,
      sessions,
      sessionCountByCategory,
      currentMonthSessionCountByCategory,
    });
  } catch (error) {
    console.error("Error fetching therapist dashboard data:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});



const forgotPassword = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    console.log(email);
    const user = await Therapist.findOne({ email: email });
    if (!user) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, null, "You are not associated with any Account!")
        );
    }
    const otp = await createAndStoreOTP(email);
    console.log("otp", otp);
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
    const user = await Therapist.findOne({ email: email }).select(
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
    if (!password) {
      return res
        .status(401)
        .json(new ApiResponse(401, null, "password is required!"));
    }
    const user = await Therapist.findById(userId);
    user.password = password;
    await user.save({ validateBeforeSave: false });
    user.password = null;
    user.refreshToken = null;
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

const getTherapistSpecializations = asyncHandler(async (req, res) => {
  const { therapistId } = req.params
  try {
    const specializationList = await Therapist.findById(therapistId)
      .populate({
        path: "specialization",
        select: "name",
      }).select("specialization")
      .exec();
    if (!specializationList) {
      return res.status(404).json(new ApiError(404, null, 'Therapist not found!'))
    }
    return res.status(200).json(new ApiResponse(200, specializationList, 'Therapist found!'))
  } catch (error) {
    console.error('Error fetching therapist specializations:', error)
    return res.status(500).json(new ApiError(500, null, 'Server error'))
  }
})
export {
  register,
  login,
  validateRegister,
  activateOrDeactivate,
  therapistList,
  logout,
  getCurrentUser,
  updateTherapist,
  updateAvatar,
  getTherepistById,
  dashboard,
  forgotPassword,
  verifyOtpAllowAccess,
  setNewPasswrd,
  getTherapistSpecializations
};
