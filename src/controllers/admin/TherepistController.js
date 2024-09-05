import ApiError from "../../utils/ApiError.js";
import { Therapist } from "../../models/therapistModel.js";
import { check, validationResult } from "express-validator";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import mongoose from "mongoose";
import { sendNotification } from "../notificationController.js";
import { transporter, mailOptions } from "../../config/nodeMailer.js"
import { loginCredentialEmail } from "../../static/emailcontent.js";

const createAccessOrRefreshToken = async (user_id) => {
  const user = await Therapist.findById(user_id);
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
  check("specialization", "Specialization is required").notEmpty(),
  check("gender", "Gender is required").notEmpty(),
  check("password", "password is required").notEmpty(),
];

const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json(new ApiError(400, "Validation Error", errors.array()));
  }
  const admin = req.user || ""
  const {
    firstName,
    lastName,
    addressLine1,
    addressLine2,
    email,
    mobile,
    gender,
    dob,
    licence,
    specialization,
    bio,
    state,
    city,
    pincode,
    linkedin,
    facebook,
    highSchool,
    intermediate,
    graduation,
    postgraduation,
    additional,
    language,
    experience,
    instagram,
    bankName,
    ifsccode,
    accountNumber,
    accountHolder,
    password,
    service_charge_USD,
    USD_Price,
    service_charge_INR,
    INR_Price,
    adhar_Number,
    PAN_Number,
  } = req.body;
  const therapistData = {
    firstName,
    lastName,
    email,
    mobile,
    gender,
    dob,
    experience,
    password,
    adhar_Number,
    PAN_Number,
    service_charge_USD,
    USD_Price,
    service_charge_INR,
    INR_Price,
  };
  therapistData.address = {};
  therapistData.social = {};
  therapistData.education = {};
  therapistData.bankdetail = {};
  therapistData.availability = {};

  // therapistData.availability.start_hour = start_hour;
  // therapistData.availability.end_hour = end_hour;
  if (highSchool) therapistData.education.highSchool = highSchool;
  if (intermediate) therapistData.education.intermediate = intermediate;
  if (graduation) therapistData.education.graduation = graduation;
  if (postgraduation) therapistData.education.postgraduation = postgraduation;
  if (additional) therapistData.education.additional = additional;
  if (licence) therapistData.licence = licence;
  if (experience) therapistData.experience = experience;
  if (state) therapistData.address.state = state;
  if (city) therapistData.address.city = city;
  if (pincode) therapistData.address.pincode = pincode;
  if (addressLine1) therapistData.address.addressLine1 = addressLine1;
  if (addressLine2) therapistData.address.addressLine2 = addressLine2;
  if (linkedin) therapistData.social.linkedin = linkedin;
  if (instagram) therapistData.social.instagram = instagram;
  if (facebook) therapistData.social.facebook = facebook;
  if (bankName) therapistData.bankdetail.bankName = bankName;
  if (ifsccode) therapistData.bankdetail.ifsccode = ifsccode;
  if (accountHolder) therapistData.bankdetail.accountHolder = accountHolder;
  if (accountNumber) therapistData.bankdetail.accountNumber = accountNumber;
  if (bio) therapistData.bio = bio;

  if (specialization) {
    if (!Array.isArray(specialization)) {
      return res
        .status(400)
        .json(new ApiError(400, "", "specialization Should be array!"));
    }
    therapistData.specialization = specialization;
  }

  if (language) {
    if (!Array.isArray(language)) {
      return res
        .status(400)
        .json(new ApiError(400, "", "Language should be array!"));
    }
    therapistData.language = language;
  }

  try {
    let checkExist = await Therapist.find({ $or: [{ mobile }, { email }] });
    if (checkExist.length > 0) {
      return res.status(400).json(new ApiError(400, "", "You already exist!"));
    }

    if (req.files?.passport) {
      therapistData.bankdetail.passport = req.files.passport[0]?.path;
    }
    if (req.files?.adharcard) {
      therapistData.bankdetail.adharcard = req.files.adharcard[0]?.path;
    }
    if (req.files?.pancard) {
      therapistData.bankdetail.pancard = req.files.pancard[0]?.path;
    }
    if (req.files?.profileImage) {
      therapistData.profileImage = req.files.profileImage[0].path;
    }
    if (admin) {
      therapistData.is_active = true;
    }
    let createTherepist = new Therapist(therapistData);
    await createTherepist.save();
    if (admin) {
      const subject = "Your Unfazed Account is Ready: Login Information Enclosed"
      const htmlContent = loginCredentialEmail(email, password)
      const EmailOptions = mailOptions(email, subject, htmlContent)
      transporter.sendMail(EmailOptions, (error, info) => {
        if (error) {
          console.log("Error while sending email:", error);
        } else {
          console.log("Email sent successfully:", info.response);
        }
      });

    }
    res
      .status(200)
      .json(
        new ApiResponse(200, createTherepist, "Therepist created Successfully")
      );
  } catch (err) {
    console.log(err);
    res.status(500).json(new ApiError(500, "", err));
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
  if (!existUser.is_active) {
    return res.status(200).json(new ApiResponse(200, null, "Your account is inactive pleae contact to admin."))
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
      const { therapist_id, specialization_id } = request.body;
      if (!therapist_id || !specialization_id) {
        return response
          .status(400)
          .json(
            new ApiError(400, "Therapist id and specialization id required!")
          );
      }
      const therapist = await Therapist.findById(therapist_id, {
        _id: 1,
        email: 1,
        mobile: 1,
        gender: 1,
        address: 1,
        lastName: 1,
        language: 1,
        firstName: 1,
        is_active: 1,
        profileImage: 1,
        approvedPrice: 1,
      }).populate({
        path: "specialization",
        select: "name",
      });
      if (!therapist) {
        return response
          .status(404)
          .json(new ApiError(404, "Therapist not found!"));
      }
      const specialization = therapist.specialization.find(
        (item) => item._id.toString() === specialization_id.toString()
      );
      if (!specialization) {
        return response
          .status(404)
          .json(new ApiError(404, "Specialization not found!"));
      }
      delete therapist.specialization;
      const result = { therapist, specialization };
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
  console.log("console.log", req.user);
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

  therapist.is_active = !therapist.is_active;
  await therapist.save();
  let activeStatus = "";
  if (therapist.is_active) {
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
        is_email_verified: 1,
        is_active: 1,
        createdAt: 1,
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
// fetch current user
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateTherapist = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json(new ApiError(400, "Validation Error", errors.array()));
  }

  const { _id } = req.user?._id;
  const {
    firstName,
    lastName,
    email,
    mobile,
    gender,
    licenese,
    specialization,
    bio,
    state,
    city,
    pincode,
    completeAddress,
    linkedin,
    facebook,
    highSchool,
    intermediate,
    graduation,
    postgraduation,
    additional,
    language,
    experience,
    instagram,
    bankName,
    ifsccode,
    accountNumber,
    accountHolder,
    password,
  } = req.body;

  const therapistData = {
    firstName,
    lastName,
    email,
    mobile,
    gender,
    experience,
    password,
  };
  therapistData.address = {};
  therapistData.social = {};
  therapistData.education = {};
  therapistData.bankdetail = {};
  // EDUCATION FIELDS
  if (highSchool) therapistData.education.highSchool = highSchool;
  if (intermediate) therapistData.education.intermediate = intermediate;
  if (graduation) therapistData.education.graduation = graduation;
  if (postgraduation) therapistData.education.postgraduation = postgraduation;
  if (additional) therapistData.education.additional = additional;
  if (licenese) therapistData.licenese = licenese;
  if (experience) therapistData.experience = experience;
  // ADDRESS FIELDS
  if (state) therapistData.address.state = state;
  if (city) therapistData.address.city = city;
  if (pincode) therapistData.address.pincode = pincode;
  if (completeAddress) therapistData.address.completeAddress = completeAddress;
  // SOCIAL ACCOUNT FIELDS
  if (linkedin) therapistData.social.linkedin = linkedin;
  if (instagram) therapistData.social.instagram = instagram;
  if (facebook) therapistData.social.facebook = facebook;
  // BANK FIELDS
  if (bankName) therapistData.bankdetail.bankName = bankName;
  if (ifsccode) therapistData.bankdetail.ifsccode = ifsccode;
  if (accountHolder) therapistData.bankdetail.accountHolder = accountHolder;
  if (accountNumber) therapistData.bankdetail.accountNumber = accountNumber;
  if (bio) therapistData.bio = bio;

  if (specialization) {
    if (!Array.isArray(specialization)) {
      return res
        .status(400)
        .json(new ApiError(400, "", "specialization Should be array!"));
    }
    therapistData.specialization = specialization;
  }

  if (language) {
    if (!Array.isArray(language)) {
      return res
        .status(400)
        .json(new ApiError(400, "", "Language should be array!"));
    }
    therapistData.language = language;
  }

  try {
    if (req.files?.passport) {
      therapistData.bankdetail.passport = req.files.passport[0]?.path;
    }
    if (req.files?.adharcard) {
      therapistData.bankdetail.adharcard = req.files.adharcard[0]?.path;
    }
    if (req.files?.pancard) {
      therapistData.bankdetail.pancard = req.files.pancard[0]?.path;
    }

    let updateTherepist = await Therapist.findByIdAndUpdate(
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
        new ApiResponse(200, updateTherepist, "profile updated Successfully")
      );
  } catch (err) {
    res.status(500).send(new ApiError(500, "", err.message));
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
};
