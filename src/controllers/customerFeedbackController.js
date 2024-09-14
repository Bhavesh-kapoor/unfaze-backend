import Feedback from "../models/feedbackModel.js";
import { CustomerFeedback } from "../models/reviewsModal.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createFeedback = async (req, res) => {
  try {
    const feedback = new CustomerFeedback(req.body);
    await feedback.save();
    res.status(201).json(feedback);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await CustomerFeedback.find().populate({
      path: "therapist",
      select: "_id firstName lastName",
    });
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getFeedbackById = async (req, res) => {
  try {
    const feedback = await CustomerFeedback.findById(req.params.id).populate(
      "therapist"
    ); // Populate if needed
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    res.status(200).json(feedback);
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
    res.status(200).json(feedback);
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
