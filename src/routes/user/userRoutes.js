import { Router } from "express";
import slotRoutes from "../slot.route.js";
import feedbackRoute from "../feeback.route.js";
import sessionRouter from "./session.routes.js";
import upload from "../../middleware/admin/multer.middleware.js";
import { userEmailVerify } from "../../controllers/otpController.js";
import { getUserSessions, UserTransactions } from "../../controllers/admin/transactionsController.js";
import {
  updateAvatar,
  updateProfile,
} from "../../controllers/admin/user.controller.js";

const router = Router();

// Update user profile
router.put("/update-user", upload.single("userAvetar"), updateProfile);

// to create slots
router.use("/slot", slotRoutes);

// Routes for specialization and feedback
router.use("/feedback", feedbackRoute);

// Email verification
router.post("/email-verify", userEmailVerify);

// Session routes
router.use("/sessions", sessionRouter);

// Update user avatar
router.patch("/update-avatar", upload.single("userAvetar"), updateAvatar);

router.get("/get-sessions", getUserSessions);
router.get("/get-transactions", UserTransactions);
export default router;
