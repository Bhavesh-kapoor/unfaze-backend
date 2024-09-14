import { Router } from "express";
import slotRoutes from "../slot.route.js";
import feedbackRoute from "../feeback.route.js";
import sessionRouter from "./session.routes.js";
import upload from "../../middleware/admin/multer.middleware.js";
import { userEmailVerify } from "../../controllers/otpController.js";
import {
  getUserSessions,
  UserTransactions,
  thankyou,
} from "../../controllers/admin/transactionsController.js";
import {
  generateInvoice,
  updateAvatar,
  updateProfile,
} from "../../controllers/admin/user.controller.js";
import { generateSessionToken } from "../../controllers/agora.js";
import {
  sendMobileOtp,
  mobileVerify,
} from "../../controllers/otpController.js";

const router = Router();

// Update user profile
router.put("/update-user", upload.single("userAvetar"), updateProfile);

// to create slots
router.use("/slot", slotRoutes);

router.post("/generate-invoice", generateInvoice);

// Routes for specialization and feedback
router.use("/feedback", feedbackRoute);

// Email verification
router.post("/email-verify", userEmailVerify);

// Session routes
router.use("/sessions", sessionRouter);

// Update user avatar
router.patch("/update-avatar", upload.single("userAvetar"), updateAvatar);

router.get("/get-sessions", getUserSessions);

router.get("/get-transactions", UserTransactions);

router.get("/joining-token", generateSessionToken);

router.get("/thankyou", thankyou);

router.post("/send-mobile-otp", sendMobileOtp);

router.post("/verify-mobile-otp", mobileVerify);

export default router;
