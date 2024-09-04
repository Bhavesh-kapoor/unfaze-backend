import express from "express";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import verifyJwtToken from "../middleware/admin/verifyJwtToken.js";

import userRoutes from "./user/userRoutes.js";
import paymentRoutes from "./payment.route.js";
import adminRoutes from "./admin/auth.route.js";
import publicRoute from "../routes/public.route.js";
import publicAdminRoute from "../routes/admin/adminpublic.route.js";

// Initialize the router
const router = express.Router();

// handle public routes
router.use("/public", publicRoute);

// handle admin public routes
router.use("/public/admin", publicAdminRoute);

// handle authentication for admin users
router.use("/admin", verifyJwtToken, adminRoutes);

// handle user auth routes for (local)
router.use("/auth/user", verifyJwtToken, userRoutes);

// handle payment routes
router.use("/payment", verifyJwtToken, paymentRoutes);

// Get current user data when JWT token is valid
router.get(
  "/get-current-user",
  verifyJwtToken,
  asyncHandler(async (req, res) => {
    return res
      .status(200)
      .json(new ApiResponse(200, req.user, "User fetched successfully"));
  })
);

export default router;
