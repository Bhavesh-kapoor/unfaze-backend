import express from "express";
import {
  createFeedback,
  getAllFeedbacks,
  getFeedbackById,
  updateFeedbackById,
  deleteFeedbackById,
  createSessionFeedback,
} from "../controllers/customerFeedbackController.js";
import verifyJwtToken from "../middleware/admin/verifyJwtToken.js";

const router = express.Router();

// Create a new feedback
router.post("/create", verifyJwtToken, createFeedback);

// to submit the feedback of session
router.post("/submit-review", verifyJwtToken, createSessionFeedback);

// Get all feedbacks
router.get("/all", getAllFeedbacks);

// Get feedback by ID
router.get("/:id", verifyJwtToken, getFeedbackById);

// Update feedback by ID
router.put("/update/:id", verifyJwtToken, updateFeedbackById);

// Delete feedback by ID
router.delete("/delete/:id", verifyJwtToken, deleteFeedbackById);

export default router;
