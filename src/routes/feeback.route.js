import { Router } from "express";
import {
  submitFeeback,
  validateFeeback,
  getTherepistFeedback,
} from "../controllers/admin/FeedbackController.js";

const feedbackRoute = Router();

feedbackRoute.post("/submitFeeback", validateFeeback, submitFeeback);

feedbackRoute.post("/therepist-feedback", getTherepistFeedback);

export default feedbackRoute;
