// authRoutes.js
import express from "express";
import passport from "../../config/passportUser.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import { User } from "../../models/userModel.js";

const router = express.Router();

router.get(
  "/user/google",
  passport.authenticate("google-user", { scope: ["profile", "email"] })
);
router.get(
  "/user/google/callback",
  passport.authenticate("google-user", {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
  }),

  (req, res) => {
    res.redirect(
      `${process.env.FRONTEND_URL}?token=${req.user.accessToken}&user=${
        req.user?.user?.firstName + " " + req.user?.user?.lastName
      }`
    );
  }
);

router.get(
  "/user/facebook",
  passport.authenticate("facebook-user", { scope: ["email"] })
);

router.get(
  "/user/facebook/callback",
  passport.authenticate("facebook-user", {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
  }),

  (req, res) => {
    res.redirect(
      `${process.env.FRONTEND_URL}?token=${req.user.accessToken}&user=${
        req.user?.user?.firstName + " " + req.user?.user?.lastName
      }`
    );
  }
);
export default router;
