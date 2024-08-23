import { Router } from "express";
import { sendOtp } from "../controllers/otpController.js";

const router = Router();
router.post("/send-otp", sendOtp)

export default router;