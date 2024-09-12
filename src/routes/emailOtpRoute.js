import { Router } from "express";
import { sendOtp, sendMobileOtp } from "../controllers/otpController.js";

const router = Router();

router.post("/send-otp", sendOtp);
router.post("/mobile-otp", sendMobileOtp)

export default router;
