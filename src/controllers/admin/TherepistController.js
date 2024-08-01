import ApiError from "../../utils/ApiError.js";
import { Therapist } from "../../models/therepistModel.js";
import { check, validationResult } from "express-validator";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import mongoose from "mongoose";

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
];

const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json(new ApiError(400, "Validation Error", errors.array()));
  }

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
    accoundNumber,
    accountHolder,
    password,
    start_hour,
    end_hour,
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
  console.log(
    "checkk",
    firstName,
    lastName,
    email,
    mobile,
    gender,
    password,
    start_hour,
    end_hour
  );
  therapistData.address = {};
  therapistData.social = {};
  therapistData.education = {};
  therapistData.bankdetail = {};
  therapistData.availability = {};

  therapistData.availability.start_hour = start_hour;
  therapistData.availability.end_hour = end_hour;
  if (highSchool) therapistData.education.highSchool = highSchool;
  if (intermediate) therapistData.education.intermediate = intermediate;
  if (graduation) therapistData.education.graduation = graduation;
  if (postgraduation) therapistData.education.postgraduation = postgraduation;
  if (additional) therapistData.education.additional = additional;
  if (licenese) therapistData.licenese = licenese;
  if (experience) therapistData.experience = experience;
  if (state) therapistData.address.state = state;
  if (city) therapistData.address.city = city;
  if (pincode) therapistData.address.pincode = pincode;
  if (completeAddress) therapistData.address.completeAddress = completeAddress;
  if (linkedin) therapistData.social.linkedin = linkedin;
  if (instagram) therapistData.social.instagram = instagram;
  if (facebook) therapistData.social.facebook = facebook;
  if (bankName) therapistData.bankdetail.bankName = bankName;
  if (ifsccode) therapistData.bankdetail.ifsccode = ifsccode;
  if (accountHolder) therapistData.bankdetail.accountHolder = accountHolder;
  if (accoundNumber) therapistData.bankdetail.accoundNumber = accoundNumber;
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

    let createTherepist = new Therapist(therapistData);
    await createTherepist.save();
    res
      .status(200)
      .json(new ApiResponse(200, "", "Therepist created Successfully"));
  } catch (err) {
    res.status(500).json(new ApiError(500, "", err.message));
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

  // now check password is correct  or not
  const isPasswordCorrect = await existUser.isPasswordCorrect(password);
  console.log("isPasswordCorrect", isPasswordCorrect);
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

  return res
    .status(200)
    .json(
      new ApiResponse(200, therapist, "Active status updated successfully!")
    );
});

const getAllTherepist = asyncHandler(async (req, res) => {
  let allTherepist = await Therapist.find().sort({ _id: -1 }).lean();
  res
    .status(200)
    .json(new ApiResponse(200, allTherepist, "Therepist found Successfully!"));
});

// fetch current user
const getCurrentUser = asyncHandler(async (req, res) => {
  console.log("user....------", req.user);
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

export {
  register,
  login,
  validateRegister,
  activateOrDeactivate,
  getAllTherepist,
  logout,
  getCurrentUser,
  updateTherapist,
};
