import { Router } from "express";
import { sendEmailOtp,verifyEmailOtp } from "../controllers/otpController.js";

const router = Router();
router.post("/send-otp",sendEmailOtp)
router.post("/verify-otp",verifyEmailOtp)

export default router;