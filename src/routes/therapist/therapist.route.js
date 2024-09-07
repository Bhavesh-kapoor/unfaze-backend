import { Router } from "express";
import courseRouter from "./course.route.js";
import therepistAuth from "../admin/therepist.auth.js";
import { therapistEmailVerify } from "../../controllers/otpController.js";
import { getTherapistSessions, getTherapistRevenue, getUserSessions } from "../../controllers/admin/transactionsController.js";

const router = Router();

router.use("/auth", therepistAuth);

// router.use("/course", courseRouter);

router.post("/email-verify", therapistEmailVerify);
router.get("/get-sessions", getTherapistSessions);
router.get("/get-revenue", getTherapistRevenue);
router.get("/get-sessions", getUserSessions)
export default router;