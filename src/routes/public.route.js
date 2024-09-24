import express from "express";
import passport from "../config/passportUser.js";
import {
  therapistList,
  findBolgbySlug,
  therapistDetails,
  therapistListByGroup,
  getAllTherapistList,
} from "../controllers/public/public.controller.js";
import { sendOtp } from "../controllers/otpController.js";
import { getAllBlogs } from "../controllers/admin/BlogsController.js";
import { getAllSpecialization } from "../controllers/admin/SpecilizationController.js";
import {
  register,
  userlogin,
  refreshToken,
  validateRegister,
} from "../controllers/admin/user.controller.js";
import {
  upload,
  compressImage,
} from "../middleware/admin/multer.middleware.js";
import customerFeedbackRoutes from "./customerFeedbackRoutes.js";
import specializationRoutes from "./admin/specilization.route.js";
import { raiseQuery } from "../controllers/admin/contactUsController.js";
import {
  login as therapistLogin,
  getTherapistSpecialization,
  register as therapistRegister,
  validateRegister as therapistValidateRegister,
  forgotPassword as therapistforgotPassword,
  verifyOtpAllowAccess as therapistVerifyOtpAllowAccess,
} from "../controllers/admin/TherepistController.js";
import { sendMobileOtp } from "../controllers/otpController.js";
// import { userEmailVerify } from "../controllers/otpController.js";
import { getSlotsByDate } from "../controllers/slotController.js";
import {
  forgotPassword,
  verifyOtpAllowAccess,
} from "../controllers/admin/user.controller.js";
import {
  getFAQDataBySlug,
  getSeoDataBySlug,
} from "../controllers/admin/seoController.js";

const router = express.Router();

const multipleImages = upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "highschoolImg", maxCount: 1 },
  { name: "graduationImg", maxCount: 1 },
  { name: "intermediateImg", maxCount: 1 },
  { name: "postGraduationImg", maxCount: 1 },
]);

const handleAuthRedirect = (req, res) => {
  if (req.user) {
    const { accessToken, user } = req.user;

    if (user && accessToken) {
      const { firstName, lastName } = user;
      res.redirect(
        `${process.env.FRONTEND_URL}?token=${accessToken}&user=${firstName} ${lastName}&role=user`
      );
    } else res.redirect(`${process.env.FRONTEND_URL}/login`);
  } else res.redirect(`${process.env.FRONTEND_URL}/login`);
};

// User registration with profile image upload
router.post(
  "/register",
  upload.single("profileImage"),
  compressImage,
  validateRegister,
  register
);
router.post("/send-mobile-otp", sendMobileOtp);

// User login
router.post("/login", userlogin);

router.post("/seo", getSeoDataBySlug);

router.post("/faq", getFAQDataBySlug);

router.use("/email/send-otp", sendOtp);

router.get("/get-blog-list", getAllBlogs);

router.post("/refreshToken", refreshToken);

router.use("/reviews", customerFeedbackRoutes);

router.post("/therapist/login", therapistLogin);

router.post("/forget-password", forgotPassword);

router.post("/verify-otp-grant-access", verifyOtpAllowAccess);

router.get("/therapist/forget-password", therapistforgotPassword);

router.post(
  "/therapist/verify-otp-grant-access",
  therapistVerifyOtpAllowAccess
);

// router.get("/mail-otp-verify", userEmailVerify);

router.get("/get-blog-details", findBolgbySlug);

router.get("/get-therapist-list", therapistList);

router.use("/contact-us/raise-query", raiseQuery);

router.use("/specialization", specializationRoutes);

router.get("/get-services-list", getAllSpecialization);

router.get("/therapist-details/:slug", therapistDetails);

router.post("/get-checkout", getTherapistSpecialization);

router.get("/slot/list/:therapist_id/:date", getSlotsByDate);

router.get("/get-therapist-list-by-category", therapistListByGroup);

router.get("/therapist-list", getAllTherapistList);

router.post(
  "/therapist/register",
  multipleImages,
  compressImage,
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
