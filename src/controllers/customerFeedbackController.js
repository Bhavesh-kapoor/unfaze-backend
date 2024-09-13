import { CustomerFeedback } from "../models/reviewsModal.js";

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
