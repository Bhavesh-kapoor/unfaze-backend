import express from "express";
import passport from "../config/passportUser.js";
import {
  therapistList,
  therapistDetails,
  therapistListByGroup,
  findBolgbySlug,
} from "../controllers/public/public.controller.js";
import { sendOtp } from "../controllers/otpController.js";
import { getAllBlogs } from "../controllers/admin/BlogsController.js";
import { getAllSpecialization } from "../controllers/admin/SpecilizationController.js";
import {
  refreshToken,
  register,
  userlogin,
  validateRegister,
} from "../controllers/admin/user.controller.js";
import upload from "../middleware/admin/multer.middleware.js";
import specializationRoutes from "./admin/specilization.route.js";
import { raiseQuery } from "../controllers/admin/contactUsController.js";
import {
  register as therapistRegister,
  login as therapistLogin,
  getTherapistSpecialization,
  validateRegister as therapistValidateRegister,
} from "../controllers/admin/TherepistController.js";

const router = express.Router();

const multipleImages = upload.fields([
  { name: "passport", maxCount: 1 },
  { name: "adharcard", maxCount: 1 },
  { name: "pancard", maxCount: 1 },
  { name: "profileImage", maxCount: 1 },
]);

const handleAuthRedirect = (req, res) => {
  if (req.user) {
    const { accessToken, user } = req.user;

    if (user && accessToken) {
      const { firstName, lastName } = user;
      res.redirect(
        `${process.env.FRONTEND_URL}?token=${accessToken}&user=${firstName} ${lastName}&role=user`
      );
    } else {
      res.redirect(`${process.env.FRONTEND_URL}/login`);
    }
  } else {
    res.redirect(`${process.env.FRONTEND_URL}/login`);
  }
};

// User registration with profile image upload
router.post(
  "/register",
  upload.single("profileImage"),
  validateRegister,
  register
);

// User login
router.post("/login", userlogin);
router.post("/therapist/login", therapistLogin);

router.use("/specialization", specializationRoutes);

router.post("/refreshToken", refreshToken);

router.get("/get-blog-list", getAllBlogs);

router.use("/email/send-otp", sendOtp);

router.get("/get-blog-details", findBolgbySlug);

router.get("/get-therapist-list", therapistList);

router.use("/contact-us/raise-query", raiseQuery);

router.get("/get-services-list", getAllSpecialization);

router.get("/therapist-details/:slug", therapistDetails);

router.post("/get-checkout", getTherapistSpecialization);

router.get("/get-therapist-list-by-category", therapistListByGroup);

router.post(
  "/therapist/register",
  multipleImages,
  therapistValidateRegister,
  therapistRegister
);

router.get(
  "/user/google",
  passport.authenticate("google-user", { scope: ["profile", "email"] })
);

router.get(
  "/user/google/callback",
  passport.authenticate("google-user", {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
  }),
  handleAuthRedirect
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
  handleAuthRedirect
);

export default router;
