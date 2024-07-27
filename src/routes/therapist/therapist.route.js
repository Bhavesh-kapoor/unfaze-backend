import { Router } from "express";
import courseRouter from "./course.route.js";
import therepistAuth from "../admin/therepist.auth.js";

const therapistRouter = Router();

therapistRouter.use("/course", courseRouter);
therapistRouter.use("/auth",therepistAuth)

export default therapistRouter; 