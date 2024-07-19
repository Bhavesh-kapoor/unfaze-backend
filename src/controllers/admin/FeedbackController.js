import feedbackModel from "../../models/feedbackModel.js";
import ApiError from "../../utils/ApiError.js";
import AysncHandler from "../../utils/asyncHandler.js";
import { check, validationResult } from "express-validator";
import ApiResponse from "../../utils/ApiResponse.js";
import mongoose from "mongoose";

const validateFeeback = [
  check("therepist_id", "Therepist id is required").notEmpty(),
  check("user_id", "User id is required").notEmpty(),
  check("star", "Star is required").notEmpty(),
  check("feedback", "feeback is required").notEmpty(),
];

const submitFeeback = AysncHandler(async (req, res) => {
  var errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(new ApiError(400, "", errors.array()));
  }
  const { therepist_id, user_id, star, feedback } = req.body;
  checkObjectIdOrNot(therepist_id)
    ? res
        .status(400)
        .json(
          new ApiError(400, "", "Please pass valid id for user and therepist")
        )
    : "";
  const feedbackdata = { therepist_id, user_id, star, feedback };
  const SaveFeedback = await feedbackModel.create(feedbackdata);
  if (SaveFeedback) {
    res
      .status(200)
      .json(
        200,
        new ApiResponse(200, SaveFeedback, "Feedback Saved Successfully!")
      );
  }
});

const getTherepistFeedback = AysncHandler(async (req, res) => {
  const { therepist_id } = req.body;
  if (!therepist_id) {
    res
      .status(400)
      .json(new ApiResponse(400, "", "Please provide therepist id"));
  }
  // check therepist exist or not
  !checkValidObjectId(therepist_id)
    ? res.status(400).json(new ApiError(400, "", "Therepist Not Found"))
    : "";

  const pipeline = [
    {
      $lookup: {
        from: "therepists",
        as: "therepists",
        localField: "therepist_id",
        foreignField: "_id",
      },
    },

    {
      $lookup: {
        from: "users",
        as: "users",
        localField: "user_id",
        foreignField: "_id",
      },
    },
    {
      $project: {
        feedback: 1,
        star: 1,
        createdAt: 1,
        "users.name": 1,
        "therepists.firstName": 1,
        "therepists.lastName": 1,
      },
    },
  ];
  const GetFeedback = await feedbackModel.aggregate(pipeline);
  res
    .status(200)
    .json(
      new ApiResponse(200, GetFeedback, "Feedback Data found successfully!")
    );
});

const checkObjectIdOrNot = (object_id) => {
  return !mongoose.Types.ObjectId.isValid(object_id) ? true : false;
};

const checkValidObjectId = async (therepist_id) => {
  return (await feedbackModel.findById(therepist_id)) ? true : false;
};
export { submitFeeback, validateFeeback, getTherepistFeedback };
