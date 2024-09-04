import { Router } from "express";
import courseRouter from "./course.route.js";
import therepistAuth from "../admin/therepist.auth.js";
import { therapistEmailVerify } from "../../controllers/otpController.js";

const router = Router();

router.use("/auth", therepistAuth);

router.use("/course", courseRouter);

router.post("/email-verify", therapistEmailVerify);

export default router;
