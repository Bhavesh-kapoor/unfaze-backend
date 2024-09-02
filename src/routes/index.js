import express from "express";
import emailRoutes from "./emailOtpRoute.js";
import userRoutes from "./user/userRoutes.js";
import blogsrouter from "./admin/blogs.route.js";
import contactusRoutes from "./contactUs.router.js";
import publicRoute from "../routes/public.route.js";
import therapistRoutes from "./therapist/therapist.route.js";
import specializationRoute from "./admin/specilization.route.js";
import authroutes from "./admin/auth.route.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import verifyJwtToken from "../middleware/admin/auth.middleware.js";


// Initialize the router
const router = express.Router();
router.use("/admin", authroutes);
router.use("/public", publicRoute);
router.use("/user", userRoutes);
router.use("/email", emailRoutes);
router.use("/blogs", blogsrouter);
router.use("/therapist", therapistRoutes);
router.use("/specialization", specializationRoute);
router.get("/get-current-user",verifyJwtToken, asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User fetched successfully"));
}));


export default router;
