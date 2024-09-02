import express from "express";
import emailRoutes from "./emailOtpRoute.js";
import userRoutes from "./user/userRoutes.js";
import blogsrouter from "./admin/blogs.route.js";
import contactusRoutes from "./contactUs.router.js";
import publicRoute from "../routes/public.route.js";
import therapistRoutes from "./therapist/therapist.route.js";
import specializationRoute from "./admin/specilization.route.js";

// Initialize the router
const router = express.Router();

router.use("/public", publicRoute);
router.use("/user", userRoutes);
router.use("/email", emailRoutes);
router.use("/blogs", blogsrouter);
router.use("/therapist", therapistRoutes);
router.use("/specialization", specializationRoute);

export default router;
