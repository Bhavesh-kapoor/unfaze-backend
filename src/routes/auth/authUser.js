import express from "express";
import passport from "../../config/passportUser.js";

const router = express.Router();

const handleAuthRedirect = (req, res) => {
  if (req.user) {
    const { accessToken, user } = req.user;

    if (user && accessToken) {
      const { firstName, lastName } = user;
      res.redirect(
        `${process.env.FRONTEND_URL}?token=${accessToken}&user=${firstName} ${lastName}`
      );
    } else {
      res.redirect(`${process.env.FRONTEND_URL}/login`);
    }
  } else {
    res.redirect(`${process.env.FRONTEND_URL}/login`);
  }
};

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
