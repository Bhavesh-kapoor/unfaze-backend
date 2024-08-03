import { Router } from "express";
import courseRouter from "./course.route.js";
import therepistAuth from "../admin/therepist.auth.js";
import { therapistEmailVerify } from "../../controllers/otpController.js";

const therapistRouter = Router();

therapistRouter.use("/course", courseRouter);
therapistRouter.use("/auth",therepistAuth)
therapistRouter.post("/email-verify",therapistEmailVerify)

export default therapistRouter;