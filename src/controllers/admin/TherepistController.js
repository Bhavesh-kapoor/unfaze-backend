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
    education,
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
  } = req.body;

  const therepistdata = {
    firstName,
    lastName,
    email,
    mobile,
    gender,
    experience,
    password,
  };
  therepistdata.address = {};
  therepistdata.social = {};
  therepistdata.education = {};
  therepistdata.bankdetail = {};
  if (highSchool) therepistdata.education.highSchool = highSchool;
  if (intermediate) therepistdata.education.intermediate = intermediate;
  if (graduation) therepistdata.education.graduation = graduation;
  if (postgraduation) therepistdata.education.postgraduation = postgraduation;
  if (additional) therepistdata.education.additional = additional;
  if (licenese) therepistdata.licenese = licenese;
  if (experience) therepistdata.experience = experience;
  if (state) therepistdata.address.state = state;
  if (city) therepistdata.address.city = city;
  if (pincode) therepistdata.address.pincode = pincode;
  if (completeAddress) therepistdata.address.completeAddress = completeAddress;
  if (linkedin) therepistdata.social.linkedin = linkedin;
  if (instagram) therepistdata.social.instagram = instagram;
  if (facebook) therepistdata.social.facebook = facebook;
  if (bankName) therepistdata.bankdetail.bankName = bankName;
  if (ifsccode) therepistdata.bankdetail.ifsccode = ifsccode;
  if (accountHolder) therepistdata.bankdetail.accountHolder = accountHolder;
  if (accoundNumber) therepistdata.bankdetail.accoundNumber = accoundNumber;
  if (bio) therepistdata.bio = bio;

  if (specialization) {
    if (!Array.isArray(specialization)) {
      return res
        .status(400)
        .json(new ApiError(400, "", "specialization Should be array!"));
    }
    therepistdata.specialization = specialization;
  }

  if (language) {
    if (!Array.isArray(language)) {
      return res
        .status(400)
        .json(new ApiError(400, "", "Language should be array!"));
    }
    therepistdata.language = language;
  }

  try {
    let checkExist = await Therapist.find({ $or: [{ mobile }, { email }] });
    if (checkExist.length > 0) {
      return res.status(400).json(new ApiError(400, "", "You already exist!"));
    }

    if (req.files?.passport) {
      therepistdata.bankdetail.passport = req.files.passport[0]?.path;
    }
    if (req.files?.adharcard) {
      therepistdata.bankdetail.adharcard = req.files.adharcard[0]?.path;
    }
    if (req.files?.pancard) {
      therepistdata.bankdetail.pancard = req.files.pancard[0]?.path;
    }

    let createTherepist = new Therapist(therepistdata);
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
    console.log("console.log",req.user)
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
  const { id, active } = req.body;
  if (!id || !active) {
    res
      .status(400)
      .json(
        new ApiError(
          400,
          "",
          "Please pass object id and active status that want to set"
        )
      );
  }
  let allowedValues = [0, 1];
  if (!allowedValues.includes(active))
    res
      .status(400)
      .json(
        new ApiError(400, "", "You can set the activate calue  only 1 and 0 ")
      );
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json(new ApiError(400, "", "Invalid Object Id"));
  }
  // set the value of
  const UpdateValue = await Therapist.findById(id);
  if (!UpdateValue)
    res.status(400).json(new ApiError(400, "", "No Data Found!"));
  UpdateValue.is_active = active;
  await UpdateValue.save();
  res
    .status(200)
    .json(new ApiResponse(200, "", "Therepist Updated Succussfully!"));
});

const getAllTherepist = asyncHandler(async (req, res) => {
  let allTherepist = await Therapist.find().sort({ _id: -1 }).lean();
  res
    .status(200)
    .json(new ApiResponse(200, allTherepist, "Therepist found Successfully!"));
});


// fetch current user
const getCurrentUser = asyncHandler(async(req, res) => {
  console.log("user....------",req.user)
  return res
  .status(200)
  .json(new ApiResponse(
      200,
      req.user,
      "User fetched successfully"
  ))
})
export {
  register,
  login,
  validateRegister,
  activateOrDeactivate,
  getAllTherepist,
  logout,
  getCurrentUser
};
