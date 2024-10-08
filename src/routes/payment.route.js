import { Router } from "express";
import {
  processPayment,
  validatePayment,
} from "../middleware/admin/phonePayConfig.js";
import {
  createOrder,
  verifyPayment,
} from "../controllers/payment/cashfree.controller.js";
import {
  handleCashfreePayment,
  handlePhonepayPayment,
} from "../controllers/paymentHandler.js";

const router = Router();

// Course enrollment routes
router.post("/pay", processPayment);
router.post("/create-order", createOrder);

// Phonepay payment verification
router.get(
  "/validate/:merchantTransactionId",
  validatePayment,
  handlePhonepayPayment
);


// Cashfree payment verification
router.get("/verify/:order_id", verifyPayment, handleCashfreePayment);

export default router;

