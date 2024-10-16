import express from "express";
import userRoutes from "./user/userRoutes.js";
import paymentRoutes from "./payment.route.js";
import adminRoutes from "./admin/auth.route.js";
import ApiResponse from "../utils/ApiResponse.js";
import publicRoute from "../routes/public.route.js";
import asyncHandler from "../utils/asyncHandler.js";
import verifyJwtToken from "../middleware/admin/verifyJwtToken.js";
import publicAdminRoute from "../routes/admin/adminpublic.route.js";
import therapistRoute from "../routes/therapist/therapist.route.js";
import refundRoutes from "./refundRoute.js";
import { callback } from "../middleware/admin/phonePayConfig.js";
import chatRoute from "./message.routes.js";
import corpAdminRoute from "./corporate/corpadminRoutes.js"
import corpUserRoute from "./corporate/corpUserRoute.js"

// Initialize the router
const router = express.Router();

// handle public routes
router.use("/public", publicRoute);

// handle admin public routes
router.use("/public/admin", publicAdminRoute);

// handle authentication for admin users
router.use("/admin", verifyJwtToken, adminRoutes);
//corporate admin
router.use("/corp-admin", verifyJwtToken, corpAdminRoute);
router.use("/corp-user", verifyJwtToken, corpUserRoute);

// handle user auth routes for (local)
router.use("/auth/user", verifyJwtToken, userRoutes);

//therapist auth routes
router.use("/auth/therapist", verifyJwtToken, therapistRoute);

// handle payment routes

router.use("/payment", verifyJwtToken, paymentRoutes);
router.post("/payment/callback/:transactionId", callback);


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
router.use("/admin/refund", verifyJwtToken, refundRoutes);
router.use("/refund", verifyJwtToken, refundRoutes);
router.use("/chat", verifyJwtToken, chatRoute);

export default router;
