import { Router } from "express";
import slotRoutes from "../slot.route.js";
import feedbackRoute from "../feeback.route.js";
import sessionRouter from "./session.routes.js";
import upload from "../../middleware/admin/multer.middleware.js";
import { userEmailVerify } from "../../controllers/otpController.js";
import {
  thankyou,
  getUserSessions,
  UserTransactions,
} from "../../controllers/admin/transactionsController.js";
import {
  updateAvatar,
  updateProfile,
  generateInvoice,
} from "../../controllers/admin/user.controller.js";
import { generateSessionToken } from "../../controllers/agora.js";
import {
  sendMobileOtp,
  mobileVerify,
} from "../../controllers/otpController.js";
import { sessionCompleted } from "../../controllers/admin/sessionsControllers.js";
import { setNewPasswrd } from "../../controllers/admin/user.controller.js";
const router = Router();

router.use("/slot", slotRoutes);

router.get("/thankyou", thankyou);

router.use("/feedback", feedbackRoute);

router.use("/sessions", sessionRouter);

router.post("/email-verify", userEmailVerify);

router.post("/send-mobile-otp", sendMobileOtp);

router.get("/get-sessions", getUserSessions);

router.post("/verify-mobile-otp", mobileVerify);

router.post("/generate-invoice", generateInvoice);

router.get("/get-transactions", UserTransactions);
router.put("/set-new-password", setNewPasswrd);
router.get("/joining-token", generateSessionToken);
router.put("/session-completed/:sessionId", sessionCompleted);
router.put("/update-user", upload.single("userAvetar"), updateProfile);
router.patch("/update-avatar", upload.single("userAvetar"), updateAvatar);

export default router;
