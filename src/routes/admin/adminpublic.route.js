import { Router } from "express";
import {
  adminlogin,
  refreshToken,
  forgotPassword,
  verifyOtpAllowAccess,
} from "../../controllers/admin/user.controller.js";

const router = Router();

router.post("/login", adminlogin);

router.post("/refreshToken", refreshToken);

router.post("/forget-password", forgotPassword);

router.post("/verify-otp-grant-access", verifyOtpAllowAccess);

export default router;
