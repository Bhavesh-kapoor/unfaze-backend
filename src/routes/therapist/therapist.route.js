import { Router } from "express";
import therepistAuth from "../admin/therepist.auth.js";
import { therapistEmailVerify } from "../../controllers/otpController.js";
import {
  getTherapistRevenue,
  getTherapistSessions,
} from "../../controllers/admin/transactionsController.js";

const router = Router();

router.use("/", therepistAuth);

router.post("/email-verify", therapistEmailVerify);

// router.get("/get-sessions", getTherapistSessions);

router.get("/get-revenue", getTherapistRevenue);

export default router;
