import ApiError from "../../utils/ApiError.js";
import { Therapist } from "../../models/therapistModel.js";
import { check, validationResult } from "express-validator";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import mongoose from "mongoose";
import { sendNotification } from "../notificationController.js";
import { transporter, mailOptions } from "../../config/nodeMailer.js";
import { loginCredentialEmail } from "../../static/emailcontent.js";
import { generateTempPassword } from "../../utils/tempPasswordGenerator.js";
import { Session } from "../../models/sessionsModel.js";
import { startOfMonth, endOfMonth, min } from 'date-fns';
import fs from "fs"

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
  check("adharNumber", "Adhar Number is required").notEmpty(),
  check("panNumber", "Pan Number is required").notEmpty(),
  check("dateOfBirth", "Date Of Birth is required").notEmpty(),
  check("experience", "Experience is required").notEmpty(),
  check("gender", "Gender is required").notEmpty(),
];

// const register = asyncHandler(async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res
//       .status(400)
//       .json(new ApiError(400, "Validation Error", errors.array()));
//   }
//   const admin = req.user || ""
//   const {
//     firstName,
//     lastName,
//     addressLine1,
//     addressLine2,
//     email,
//     mobile,
//     gender,
//     dateOfBirth,
//     licence,
//     specialization,
//     bio,
//     state,
//     city,
//     pincode,
//     linkedin,
//     facebook,
//     highSchool,
//     intermediate,
//     graduation,
//     postgraduation,
//     additional,
//     language,
//     experience,
//     instagram,
//     bankName,
//     ifsccode,
//     accountNumber,
//     accountHolder,
//     serviceChargeUsd,
//     usdPrice,
//     serviceChargeInr,
//     inrPrice,
//     adharNumber,
//     panNumber,
//   } = req.body;
//   const therapistData = {
//     firstName,
//     lastName,
//     email,
//     mobile,
//     gender,
//     dateOfBirth,
//     experience,
//     adharNumber,
//     panNumber,
//     serviceChargeUsd,
//     usdPrice,
//     serviceChargeInr,
//     inrPrice,
//   };
//   therapistData.address = {};
//   therapistData.social = {};
//   therapistData.education = {};
//   therapistData.bankdetail = {};
//   therapistData.availability = {};

//   // therapistData.availability.start_hour = start_hour;
//   // therapistData.availability.end_hour = end_hour;
//   if (highSchool) therapistData.education.highSchool = highSchool;
//   if (intermediate) therapistData.education.intermediate = intermediate;
//   if (graduation) therapistData.education.graduation = graduation;
//   if (postgraduation) therapistData.education.postgraduation = postgraduation;
//   if (additional) therapistData.education.additional = additional;
//   if (licence) therapistData.licence = licence;
//   if (experience) therapistData.experience = experience;
//   if (state) therapistData.address.state = state;
//   if (city) therapistData.address.city = city;
//   if (pincode) therapistData.address.pincode = pincode;
//   if (addressLine1) therapistData.address.addressLine1 = addressLine1;
//   if (addressLine2) therapistData.address.addressLine2 = addressLine2;
//   if (linkedin) therapistData.social.linkedin = linkedin;
//   if (instagram) therapistData.social.instagram = instagram;
//   if (facebook) therapistData.social.facebook = facebook;
//   if (bankName) therapistData.bankdetail.bankName = bankName;
//   if (ifsccode) therapistData.bankdetail.ifsccode = ifsccode;
//   if (accountHolder) therapistData.bankdetail.accountHolder = accountHolder;
//   if (accountNumber) therapistData.bankdetail.accountNumber = accountNumber;
//   if (bio) therapistData.bio = bio;

//   if (specialization) {
//     if (!Array.isArray(specialization)) {
//       return res
//         .status(400)
//         .json(new ApiError(400, "", "specialization Should be array!"));
//     }
//     therapistData.specialization = specialization;
//   }

//   if (language) {
//     if (!Array.isArray(language)) {
//       return res
//         .status(400)
//         .json(new ApiError(400, "", "Language should be array!"));
//     }
//     therapistData.language = language;
//   }

//   try {
//     let checkExist = await Therapist.find({ $or: [{ mobile }, { email }] });
//     if (checkExist.length > 0) {
//       return res.status(400).json(new ApiError(400, "", "You already exist!"));
//     }

//     if (req.files?.passport) {
//       therapistData.bankdetail.passport = req.files.passport[0]?.path;
//     }
//     if (req.files?.adharcard) {
//       therapistData.bankdetail.adharcard = req.files.adharcard[0]?.path;
//     }
//     if (req.files?.pancard) {
//       therapistData.bankdetail.pancard = req.files.pancard[0]?.path;
//     }
//     if (req.files?.profileImage) {
//       therapistData.profileImage = req.files.profileImage[0].path;
//     }
//     if (admin) {
//       therapistData.isActive = true;
//     }
//     let createTherepist = new Therapist(therapistData);
//     await createTherepist.save();
//     if (admin) {
//       const password = generateTempPassword()
//       console.log("temp password: " + password)
//       const subject = "Your Unfazed Account is Ready: Login Information Enclosed"
//       const htmlContent = loginCredentialEmail(email, password)
//       const EmailOptions = mailOptions(email, subject, htmlContent)
//       transporter.sendMail(EmailOptions, (error, info) => {
//         if (error) {
//           console.log("Error while sending email:", error);
//         } else {
//           console.log("Email sent successfully:", info.response);
//         }
//       });
//     }
//     res
//       .status(200)
//       .json(
//         new ApiResponse(200, createTherepist, "Therepist created Successfully")
//       );
//   } catch (err) {
//     console.log(err);
//     res.status(500).json(new ApiError(500, "", err));
//   }
// });

const register = asyncHandler(async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json(new ApiError(400, "Validation Error", errors.array()));
    }
    const admin = req.user || "";
    const {
      firstName,
      lastName,
      email,
      mobile,
      adharNumber,
      panNumber,
      dateOfBirth,
      gender,
      specialization,
      usdPrice,
      inrPrice,
      license,
      experience,
      bio,
      languages,
      addressDetails,
      bankDetails,
      //education
      highSchool,
      intermediate,
      graduation,
      postGraduation,
      additional,
      socialMedia,
    } = req.body;
    const existingTherapist = await Therapist.findOne({
      $or: [{ email }, { mobile }, { adharNumber }, { panNumber }],
    });
    if (existingTherapist) {
      let duplicateField = "";

      if (existingTherapist.email === email) duplicateField = "Email";
      else if (existingTherapist.mobile === mobile)
        duplicateField = "Phone Number";
      else if (existingTherapist.adharNumber === adharNumber)
        duplicateField = "Aadhar Number";
      else if (existingTherapist.panNumber === panNumber)
        duplicateField = "PAN Number";

      return res.status(400).json({
        message: `${duplicateField} already exists.`,
      });
    }
    if (!Array.isArray(specialization)) {
      return res
        .status(400)
        .json(new ApiError(400, "", "specialization Should be array!"));
    }
    if (!Array.isArray(languages)) {
      return res
        .status(400)
        .json(new ApiError(400, "", "Language should be array!"));
    }
    const therapistData = {
      firstName,
      lastName,
      email,
      mobile,
      adharNumber,
      panNumber,
      dateOfBirth,
      gender,
      specialization,
      usdPrice,
      inrPrice,
      license,
      experience,
      bio,
      languages,
      bankDetails,
      addressDetails,
      socialMedia,
      educationDetails: {
        highSchool,
        intermediate,
        graduation,
        postGraduation,
        additional,
      },
    };
    if (req.files?.profileImage) {
      therapistData.profileImageUrl = req.files.profileImage[0]?.path;
    }
    if (req.files?.highschoolImg) {
      therapistData.educationDetails.highSchool.certificateImageUrl =
        req.files.highschoolImg[0]?.path;
    }
    if (req.files?.intermediateImg) {
      therapistData.educationDetails.intermediate.certificateImageUrl =
        req.files.intermediateImg[0]?.path;
    }
    if (req.files?.graduationImg) {
      therapistData.educationDetails.graduation.certificateImageUrl =
        req.files.graduationImg[0]?.path;
    }
    if (req.files?.postGraduationImg) {
      console.log("test", req.files);
      therapistData.educationDetails.postGraduation.certificateImageUrl =
        req.files.postGraduationImg[0]?.path;
    }
    let createTherepist = new Therapist(therapistData);
    await createTherepist.save();
    if (admin) {
      const password = generateTempPassword();
      console.log("temp password: " + password);
      const subject =
        "Your Unfazed Account is Ready: Login Information Enclosed";
      const htmlContent = loginCredentialEmail(email, password);
      const EmailOptions = mailOptions(email, subject, htmlContent);
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
    console.log("else");
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
  const password = generateTempPassword();
  console.log("temp password: " + password);
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
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});
// const updateTherapist = asyncHandler(async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res
//       .status(400)
//       .json(new ApiError(400, "Validation Error", errors.array()));
//   }

//   const { _id } = req.user?._id;
//   const {
//     firstName,
//     lastName,
//     email,
//     mobile,
//     adharNumber,
//     panNumber,
//     dateOfBirth,
//     gender,
//     specialization,
//     usdPrice,
//     inrPrice,
//     license,
//     experience,
//     bio,
//     languages,
//     // Bank Details
//     bankName,
//     ifscCode,
//     accountHolder,
//     accountNumber,
//     branchName,
//     accountType,
//     // Address Details
//     country,
//     state,
//     city,
//     pincode,
//     addressLine1,
//     addressLine2,
//     landmark = "",
//     latitude = "",
//     longitude = "",
//   } = req.body;
//   // const therapistData = {
//   //   firstName,
//   //   lastName,
//   //   email,
//   //   mobile,
//   //   gender,
//   //   experience,
//   //   password,
//   // };
//   // therapistData.address = {};
//   // therapistData.social = {};
//   // therapistData.education = {};
//   // therapistData.bankdetail = {};
//   // // EDUCATION FIELDS
//   // if (highSchool) therapistData.education.highSchool = highSchool;
//   // if (intermediate) therapistData.education.intermediate = intermediate;
//   // if (graduation) therapistData.education.graduation = graduation;
//   // if (postgraduation) therapistData.education.postgraduation = postgraduation;
//   // if (additional) therapistData.education.additional = additional;
//   // if (licenese) therapistData.licenese = licenese;
//   // if (experience) therapistData.experience = experience;
//   // // ADDRESS FIELDS
//   // if (state) therapistData.address.state = state;
//   // if (city) therapistData.address.city = city;
//   // if (pincode) therapistData.address.pincode = pincode;
//   // if (completeAddress) therapistData.address.completeAddress = completeAddress;
//   // // SOCIAL ACCOUNT FIELDS
//   // if (linkedin) therapistData.social.linkedin = linkedin;
//   // if (instagram) therapistData.social.instagram = instagram;
//   // if (facebook) therapistData.social.facebook = facebook;
//   // // BANK FIELDS
//   // if (bankName) therapistData.bankdetail.bankName = bankName;
//   // if (ifsccode) therapistData.bankdetail.ifsccode = ifsccode;
//   // if (accountHolder) therapistData.bankdetail.accountHolder = accountHolder;
//   // if (accountNumber) therapistData.bankdetail.accountNumber = accountNumber;
//   // if (bio) therapistData.bio = bio;

//   // if (specialization) {
//   //   if (!Array.isArray(specialization)) {
//   //     return res
//   //       .status(400)
//   //       .json(new ApiError(400, "", "specialization Should be array!"));
//   //   }
//   //   therapistData.specialization = specialization;
//   // }

//   // if (language) {
//   //   if (!Array.isArray(language)) {
//   //     return res
//   //       .status(400)
//   //       .json(new ApiError(400, "", "Language should be array!"));
//   //   }
//   //   therapistData.language = language;
//   // }

//   try {
//     if (req.files?.passport) {
//       therapistData.bankdetail.passport = req.files.passport[0]?.path;
//     }
//     if (req.files?.adharcard) {
//       therapistData.bankdetail.adharcard = req.files.adharcard[0]?.path;
//     }
//     if (req.files?.pancard) {
//       therapistData.bankdetail.pancard = req.files.pancard[0]?.path;
//     }

//     let updateTherepist = await Therapist.findByIdAndUpdate(
//       _id,
//       therapistData,
//       {
//         new: true,
//         select: "-password -refreshToken",
//       }
//     );

//     res
//       .status(200)
//       .json(
//         new ApiResponse(200, updateTherepist, "profile updated Successfully")
//       );
//   } catch (err) {
//     res.status(500).send(new ApiError(500, "", err.message));
//   }
// });
const updateTherapist = asyncHandler(async (req, res) => {
  // Therapist ID from the authenticated user
  const _id = req.user?._id;

  const { firstName, lastName, email, mobile, adharNumber, panNumber, dateOfBirth, gender, specialization, usdPrice, inrPrice, license, experience, bio, languages, addressDetails, bankDetails, highSchool, intermediate, graduation, postGraduation, socialMedia, } = req.body;

  try {
    const existingTherapist = await Therapist.findById(_id).lean();
    if (!existingTherapist) {
      return res.status(404).json(new ApiError(404, "", "Therapist not found"));
    }

    const therapistData = {
      firstName: firstName || existingTherapist.firstName,
      lastName: lastName || existingTherapist.lastName,
      email: email || existingTherapist.email,
      mobile: mobile || existingTherapist.mobile,
      adharNumber: adharNumber || existingTherapist.adharNumber,
      panNumber: panNumber || existingTherapist.panNumber,
      dateOfBirth: dateOfBirth || existingTherapist.dateOfBirth,
      gender: gender || existingTherapist.gender,
      specialization: specialization || existingTherapist.specialization,
      usdPrice: usdPrice !== undefined ? usdPrice : existingTherapist.usdPrice,
      inrPrice: inrPrice !== undefined ? inrPrice : existingTherapist.inrPrice,
      license: license || existingTherapist.license,
      experience: experience || existingTherapist.experience,
      bio: bio || existingTherapist.bio,
      languages: languages || existingTherapist.languages,
      bankDetails: bankDetails || existingTherapist.bankDetails,
      addressDetails: addressDetails || existingTherapist.addressDetails,
      socialMedia: socialMedia || existingTherapist.socialMedia,
      educationDetails: {
        highSchool: { ...existingTherapist.educationDetails.highSchool, ...highSchool },
        intermediate: { ...existingTherapist.educationDetails.intermediate, ...intermediate },
        graduation: { ...existingTherapist.educationDetails.graduation, ...graduation },
        postGraduation: { ...existingTherapist.educationDetails.postGraduation, ...postGraduation },
      },
    };

    const deleteFile = (filePath) => {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${ filePath }`);
        } catch (err) {
          console.error(`Error deleting file: ${ filePath }`, err);
        }
      }
    };

    if (req.files?.profileImage) {
      deleteFile(existingTherapist.profileImageUrl);
      therapistData.profileImageUrl = req.files.profileImage[0]?.path;
    }

    if (req.files?.highschoolImg) {
      deleteFile(existingTherapist.educationDetails?.highSchool?.certificateImageUrl);
      therapistData.educationDetails.highSchool.certificateImageUrl =
        req.files.highschoolImg[0]?.path;
    }

    if (req.files?.intermediateImg) {
      deleteFile(existingTherapist.educationDetails?.intermediate?.certificateImageUrl);
      therapistData.educationDetails.intermediate.certificateImageUrl =
        req.files.intermediateImg[0]?.path;
    }

    if (req.files?.graduationImg) {
      deleteFile(existingTherapist.educationDetails?.graduation?.certificateImageUrl);
      therapistData.educationDetails.graduation.certificateImageUrl =
        req.files.graduationImg[0]?.path;
    }

    if (req.files?.postGraduationImg) {
      deleteFile(existingTherapist.educationDetails?.postGraduation?.certificateImageUrl);
      therapistData.educationDetails.postGraduation.certificateImageUrl = req.files.postGraduationImg[0]?.path;
    }
    console.log('therapistData.educationDetails.highSchool :>> ', therapistData.educationDetails.highSchool);
    const updatedTherapist = await Therapist.findByIdAndUpdate(_id, therapistData, {
      new: true,
      select: "-password -refreshToken",
    });

    res.status(200).json(new ApiResponse(200, updatedTherapist, "Profile updated successfully"));
  } catch (err) {
    console.error(err);
    res.status(500).json(new ApiError(500, "", err));
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
const dashboard = asyncHandler(async (req, res) => {
  const therapist = req.user;
  if (!therapist?._id) {
    return res.status(400).json({ message: "Therapist ID is required." });
  }

  try {
    const currentDate = new Date();
    console.log(currentDate)
    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = min([endOfMonth(currentDate), currentDate]);
    const [result] = await Session.aggregate([
      {
        $match: { therapist_id: therapist._id },
      },
      {
        $lookup: {
          from: "transactions",
          localField: "transaction_id",
          foreignField: "_id",
          as: "transactions_details",
        },
      },
      {
        $unwind: "$transactions_details",
      },
      {
        $lookup: {
          from: "therapists",
          localField: "transactions_details.therapist_id",
          foreignField: "_id",
          pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
          as: "therapist_details",
        },
      },
      { $unwind: "$therapist_details" },
      {
        $lookup: {
          from: "specializations",
          localField: "transactions_details.category",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1 } }],
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $lookup: {
          from: "users",
          localField: "transactions_details.user_id",
          foreignField: "_id",
          pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
          as: "user_details",
        },
      },
      { $unwind: "$user_details" },
      {
        $facet: {
          earnings: [
            {
              $group: {
                _id: null,
                amount_USD: { $sum: "$transactions_details.amount_USD" },
                amount_INR: { $sum: "$transactions_details.amount_INR" },
              },
            },
            {
              $project: {
                _id: 0,
              },
            },
          ],
          currentMonthEarnings: [
            {
              $match: {
                createdAt: {
                  $gte: firstDayOfMonth,
                  $lte: lastDayOfMonth,
                },
              },
            },
            {
              $group: {
                _id: null,
                amount_USD: { $sum: "$transactions_details.amount_USD" },
                amount_INR: { $sum: "$transactions_details.amount_INR" },
              },
            },
            {
              $project: {
                _id: 0,
              },
            },
          ],
          upcomingSessionCount: [
            {
              $match: { status: "upcoming" },
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
              $match: { status: "upcoming" },
            },
            {
              $sort: { start_time: 1 },
            },
            { $limit: 5 },
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
                category: "$category.name",
                amount_USD: "$transactions_details.amount_USD",
                amount_INR: "$transactions_details.amount_INR",
                start_time: 1,
              },
            },
          ],
        },
      },
    ]);
    const amount = result.earnings[0] || { amount_USD: 0, amount_INR: 0 };
    const currentMonthEarnings = result.currentMonthEarnings[0] || { amount_USD: 0, amount_INR: 0 };
    const upcomingSessionCount = result.upcomingSessionCount[0]?.count || 0;
    const completedSessionCount = result.completedSessionCount[0]?.count || 0;
    const sessions = result.sessions;

    if (!sessions.length) {
      return res
        .status(404)
        .json({ message: "No sessions found for the given therapist." });
    }

    return res
      .status(200)
      .json({ amount, currentMonthEarnings, completedSessionCount, upcomingSessionCount, sessions });
  } catch (error) {
    console.error("Error fetching therapist dashboard data:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
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
  dashboard,
};
