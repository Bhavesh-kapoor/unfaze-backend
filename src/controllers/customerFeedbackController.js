import ApiError from "../utils/ApiError.js";
import Feedback from "../models/feedbackModel.js";
import ApiResponse from "../utils/ApiResponse.js";
import { CustomerFeedback } from "../models/reviewsModal.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

export const createFeedback = asyncHandler(async (req, res) => {
  try {
    const { _id, role } = req.user;
    if (role === "therapist") {
      return res
        .status(400)
        .json({ message: "You are not allow to submit a review!" });
    }
    const feedback = new CustomerFeedback({ ...req.body, user: _id });
    await feedback.save();
    res
      .status(201)
      .json(new ApiResponse(201, feedback, "Your review has been submitted!"));
  } catch (error) {
    res.status(400).json({ message: "Something went wrong!" });
  }
});

export const getAllFeedbacks = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const skip = (pageNumber - 1) * limitNumber;

  try {
    const feedbacks = await CustomerFeedback.aggregate([
      {
        $lookup: {
          from: "therapists",
          localField: "therapist",
          foreignField: "_id",
          as: "therapist",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$therapist",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          therapistName: {
            $concat: ["$therapist.firstName", " ", "$therapist.lastName"],
          },
          userName: { $concat: ["$user.firstName", " ", "$user.lastName"] },
        },
      },
      {
        $project: {
          _id: 1,
          review: 1,
          rating: 1,
          isActive: 1,
          userName: 1,
          therapistName: 1,
          "therapist._id": 1,
          "user._id": 1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limitNumber,
      },
    ]);

    const totalFeedbacks = await CustomerFeedback.countDocuments();

    return res.status(200).json(
      new ApiResponse(
        true,
        {
          result: feedbacks,
          pagination: {
            totalPages: Math.ceil(totalFeedbacks / limitNumber),
            currentPage: pageNumber,
            totalItems: totalFeedbacks,
            itemsPerPage: limitNumber,
          },
        },
        "feedback Fetched Successfully "
      )
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getFeedbackById = async (req, res) => {
  try {
    const feedbackId = req.params.id;

    const feedback = await CustomerFeedback.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(feedbackId) },
      },
      {
        $lookup: {
          from: "therapists", // Collection name of therapists
          localField: "therapist",
          foreignField: "_id",
          as: "therapist",
        },
      },
      {
        $lookup: {
          from: "users", // Collection name of users
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$therapist",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          therapistName: {
            $concat: ["$therapist.firstName", " ", "$therapist.lastName"],
          },
          userName: { $concat: ["$user.firstName", " ", "$user.lastName"] },
        },
      },
      {
        $project: {
          _id: 1,
          review: 1,
          rating: 1,
          isActive: 1,
          userName: 1,
          therapistName: 1,
          "therapist._id": 1,
          "user._id": 1,
        },
      },
    ]);

    if (!feedback || feedback.length === 0) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Since aggregate returns an array, access the first element
    res
      .status(200)
      .json(new ApiResponse(true, feedback[0], "Fetched Successfully"));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateFeedbackById = async (req, res) => {
  try {
    const feedback = await CustomerFeedback.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    res
      .status(200)
      .json(new ApiResponse(true, feedback, "Updated Successfully"));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteFeedbackById = async (req, res) => {
  try {
    const feedback = await CustomerFeedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    res.status(204).send(); // No content
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createSessionFeedback = async (req, res) => {
  try {
    const { session_id, star, feedback } = req.body;
    if (!feedback) {
      throw new ApiError(400, "Feedback are required");
    }

    const feedbackInstance = new Feedback({
      session_id,
      star: star || 0,
      feedback,
    });

    await feedbackInstance.save();

    res
      .status(201)
      .json(
        new ApiResponse(201, feedbackInstance, "Feedback created successfully")
      );
  } catch (error) {
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Validation Error: " + error.message));
    }
    if (error.code && error.code === 11000) {
      return res
        .status(409)
        .json(new ApiResponse(409, null, "Duplicate entry: " + error.message));
    }
    res
      .status(500)
      .json(
        new ApiResponse(500, null, "Internal server error: " + error.message)
      );
  }
};
