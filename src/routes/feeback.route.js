import { Router } from "express";
import { submitFeeback, validateFeeback } from "../controllers/admin/FeedbackController.js";
const feedbackRoute = Router();

feedbackRoute.post('/submitFeeback',validateFeeback ,submitFeeback);

export default feedbackRoute;