import { Router } from "express";
import slotRoutes from "../slot.route.js";
import feedbackRoute from "../feeback.route.js";
import sessionRouter from "./session.routes.js";
import { upload, compressImage } from "../../middleware/admin/multer.middleware.js";
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
import { processPaymentForcourse,validatePayment } from "../../middleware/admin/phonePayConfig.js";
import { getEnrolledInCourse } from "../../controllers/EnrolledCourseController.js"; 
import { createOrderForCourse } from "../../controllers/payment/cashfree.controller.js";
import { verifyPayment } from "../../controllers/payment/cashfree.controller.js";
import { getEnrolledCashfree } from "../../controllers/EnrolledCourseController.js";
const router = Router();

router.use("/slot", slotRoutes);

router.get("/thankyou", thankyou);

router.use("/feedback", feedbackRoute);

router.use("/session", sessionRouter);

router.post("/email-verify", userEmailVerify);

router.post("/send-mobile-otp", sendMobileOtp);

router.get("/get-sessions", getUserSessions);

router.post("/verify-mobile-otp", mobileVerify);

router.post("/generate-invoice", generateInvoice);

router.get("/get-transactions", UserTransactions);
router.put("/set-new-password", setNewPasswrd);
router.get("/joining-token", generateSessionToken);
router.put("/session-completed/:sessionId", sessionCompleted);
router.put("/update-user", upload.single("userAvatar"), compressImage, updateProfile);
router.put("/update-avatar", upload.single("userAvatar"), compressImage, updateAvatar);


// course enroll route
router.post("/get-enrolled-phonepay", processPaymentForcourse);
router.get("/validate-payment-phonepay/:merchantTransactionId", validatePayment,getEnrolledInCourse);
router.post("/get-enrolled-cashfree",createOrderForCourse);
router.get("/validate-payment-cashfree",verifyPayment,getEnrolledCashfree);

export default router;
