import { Router } from "express";
import {
  adminlogin,
  refreshToken,
  register,
} from "../../controllers/admin/user.controller.js";
import verifyJwtToken from "../../middleware/admin/auth.middleware.js";
import speclizationRoute from "./specilization.route.js";
import therepistRouter from "./therepist.auth.js";
import feedbackRoute from "../feeback.route.js";
import blogsrouter from "./blogs.route.js";
import categoryRouter from "./blogCategory.route.js";

const authroutes = Router();
authroutes.post("/login", adminlogin);
authroutes.post("/register", verifyJwtToken, register);
authroutes.post("/refreshToken", verifyJwtToken, refreshToken);
authroutes.use("/specialization", verifyJwtToken, speclizationRoute);
authroutes.use("/therapist", verifyJwtToken, therepistRouter);
authroutes.use("/feedback", feedbackRoute);
authroutes.use("/blogs", verifyJwtToken, blogsrouter);
authroutes.use("/category", verifyJwtToken, categoryRouter);

export default authroutes;
