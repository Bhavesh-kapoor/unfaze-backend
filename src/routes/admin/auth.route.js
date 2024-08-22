import { Router } from "express";
import {
  adminlogin,
  refreshToken,
  register,
  getCurrentUser
} from "../../controllers/admin/user.controller.js";
import verifyJwtToken from "../../middleware/admin/auth.middleware.js";
import speclizationRoute from "./specilization.route.js";
import therepistRouter from "./therepist.auth.js";
import feedbackRoute from "../feeback.route.js";
import blogsrouter from "./blogs.route.js";
import categoryRouter from "./blogCategory.route.js";
import seoRouter from "./seo.route.js"
import userRoutes from "../admin/user.route.js";

const authroutes = Router();
authroutes.post("/login", adminlogin);
authroutes.get("/get-curent-user",verifyJwtToken, getCurrentUser);

authroutes.post("/refreshToken", verifyJwtToken, refreshToken);
authroutes.use("/specialization", verifyJwtToken, speclizationRoute);
authroutes.use("/therapist", therepistRouter);
authroutes.use("/user", userRoutes);
authroutes.use("/feedback", feedbackRoute);
authroutes.use("/blogs", verifyJwtToken, blogsrouter);
authroutes.use("/blog-category", verifyJwtToken, categoryRouter);
authroutes.use("/seo", verifyJwtToken, seoRouter);


export default authroutes;
