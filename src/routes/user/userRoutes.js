import { Router } from "express";
import verifyJwtToken from "../../middleware/admin/auth.middleware.js";
import {
  register,
  refreshToken,
  userlogin,
  validateRegister,
} from "../../controllers/admin/user.controller.js";
import speclizationRoute from "../admin/specilization.route.js";
import feedbackRoute from "../feeback.route.js";
import {
  enrollInCourse,
  validateInput,
  getEnrolledCourseList,
} from "../../controllers/enrolledCourseController.js";

const userRoutes = Router();
userRoutes.post("/register", validateRegister, register);
userRoutes.post("/login", userlogin);
userRoutes.post("/refreshToken", verifyJwtToken, refreshToken);
userRoutes.use("/specialization", verifyJwtToken, speclizationRoute);
userRoutes.use("/feedback", feedbackRoute);
userRoutes.post(
  "/course-enroll/:course_id",
  verifyJwtToken,
  validateInput,
  enrollInCourse
);
userRoutes.get("/enrolled-course-list", verifyJwtToken, getEnrolledCourseList);

export default userRoutes;
