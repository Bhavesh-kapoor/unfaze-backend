import { Router } from "express";
import verifyJwtToken from "../../middleware/admin/auth.middleware.js";
import upload from "../../middleware/admin/multer.middleware.js";
import {
  register,
  refreshToken,
  userlogin,
  validateRegister,
  updateAvatar
} from "../../controllers/admin/user.controller.js";
import speclizationRoute from "../admin/specilization.route.js";
import feedbackRoute from "../feeback.route.js";
import {
  getEnrolledCourseList,
  handlePaymentSuccess,
} from "../../controllers/enrolledCourseController.js";
import {
  processPayment,
  validatePayment,
} from "../../middleware/admin/phonePayConfig.js";

import sessionRouter from "./session.routes.js";
import { userEmailVerify } from "../../controllers/otpController.js";

const userRoutes = Router();
userRoutes.post("/register",upload.single('profileImage'),validateRegister,  register);
userRoutes.post("/login", userlogin);
userRoutes.post("/refreshToken", verifyJwtToken, refreshToken);
userRoutes.patch("/update-avatar", verifyJwtToken, upload.single('profileImage'),updateAvatar);
userRoutes.use("/specialization", verifyJwtToken, speclizationRoute);
userRoutes.use("/feedback", feedbackRoute);

//courese enrollment route
userRoutes.get("/enrolled-course-list", verifyJwtToken, getEnrolledCourseList);
userRoutes.post("/pay/:course_id", verifyJwtToken, processPayment);
userRoutes.get(
  "/validate/:merchantTransactionId/:course_id",
  verifyJwtToken,
  validatePayment,
  handlePaymentSuccess
);
userRoutes.post("/email-verify",userEmailVerify)


userRoutes.use("/sessions",sessionRouter)



export default userRoutes;