import { Router } from "express";
import courseRouter from "../admin/course.route.js";

const therapistRouter = Router();

therapistRouter.use("/course", courseRouter);

export default therapistRouter;