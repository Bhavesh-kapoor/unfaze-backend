import { Router } from "express";
import feedbackRoute from "../feeback.route.js";
import sessionRouter from "./session.routes.js";
import upload from "../../middleware/admin/multer.middleware.js";
import { userEmailVerify } from "../../controllers/otpController.js";
import { createOrder } from "../../controllers/payment/cashfree.controller.js";
import { getEnrolledCourseList } from "../../controllers/enrolledCourseController.js";
import {
  updateAvatar,
  updateProfile,
} from "../../controllers/admin/user.controller.js";

const router = Router();

// Update user profile
router.put("/update-user", updateProfile);

// Routes for specialization and feedback
router.use("/feedback", feedbackRoute);

router.post("/create-order", createOrder);

// Get EnrollmentF
router.get("/enrolled-course-list", getEnrolledCourseList);

// Email verification
router.post("/email-verify", userEmailVerify);

// Session routes
router.use("/sessions", sessionRouter);

// Update user avatar
router.patch("/update-avatar", upload.single("profileImage"), updateAvatar);

export default router;
