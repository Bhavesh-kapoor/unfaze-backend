import express from "express";
import {
  initiateRefund,
  getRefundList,
  acceptRefund,
  getRefundById,
} from "../controllers/refundController.js";

const router = express.Router();

router.post("/initiate", initiateRefund);
router.get("/get-list", getRefundList);
router.put("/edit/:refundId", acceptRefund);
router.get("/get-by-id/:id", getRefundById);

export default router;
