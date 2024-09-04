import { Router } from "express";
import {
  processPayment,
  validatePayment,
} from "../middleware/admin/phonePayConfig.js";
import { verifyPayment } from "../controllers/payment/cashfree.controller.js";
import {
  handleCashfreePayment,
  handlePhonepayPayment,
} from "../controllers/enrolledCourseController.js";

const router = Router();

// Course enrollment routes
router.post("/pay", processPayment);

// Phonepay payment verification
router.get(
  "/validate/:merchantTransactionId/:course_id",
  validatePayment,
  handlePhonepayPayment
);

// Cashfree payment verification
router.post("/verify", verifyPayment, handleCashfreePayment);

export default router;
