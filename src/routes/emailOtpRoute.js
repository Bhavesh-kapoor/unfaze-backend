import { Router } from "express";
import { sendOtp,sendMail} from "../controllers/otpController.js";

const router = Router();
router.post("/send-otp",sendOtp)

router.post("/send-mail",sendMail)


export default router;