import express from "express";
import authUser from "./auth/authUser.js";
import emailRoutes from "./emailOtpRoute.js";
import userRoutes from "./user/userRoutes.js";
import authroutes from "./admin/auth.route.js";
import blogsrouter from "./admin/blogs.route.js";
import contactusRoutes from "./contactUs.router.js";
import authTherapist from "./auth/authTherapist.js";
import therapistRoutes from "./therapist/therapist.route.js";
import specializationRoute from "./admin/specilization.route.js";

// Initialize the router
const router = express.Router();

// Social auth routes
router.use("/auth", authUser);
router.use("/auth", authTherapist);

// Admin routes
router.use("/admin", authroutes);
router.use("/user", userRoutes);
router.use("/email", emailRoutes);
router.use("/blogs", blogsrouter);
router.use("/therapist", therapistRoutes);
router.use("/contact-us", contactusRoutes);
router.use("/specialization", specializationRoute);

export default router;
