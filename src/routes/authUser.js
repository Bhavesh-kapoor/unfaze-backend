// authRoutes.js
import express from "express";
import passport from "../config/passportUser.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/userModel.js";

const router = express.Router();

const createAccessOrRefreshToken = async (user_id) => {
  const user = await Therapist.findById(user_id);
  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};
router.get(
  "/user/google",
  passport.authenticate("google-user", { scope: ["profile", "email"] })
);
router.get(
  "/user/google/callback",
  passport.authenticate("google-user", {
    successRedirect: "http://localhost:3001/profile",
    failureRedirect: "http://localhost:3001/login",
  }),
  async (req, res) => {
    try {
      const { user } = req;
      const { accessToken, refreshToken } = await createAccessOrRefreshToken(
        user._id
      );
      const options = {
        httpOnly: true,
        secure: true,
      };
      const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
      );

      res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
          new ApiResponse(200, {
            accessToken: accessToken,
            refreshToken: refreshToken,
            user: loggedInUser,
          })
        );
    } catch (error) {
      throw new ApiError(
        501,
        "Something went wrong while authenticating via google"
      );
    }
  }
);

router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    successRedirect: "http://localhost:3001/profile",
    failureRedirect: "http://localhost:3001/login",
  }),
  async (req, res) => {
    try {
      const { user } = req;
      console.log("req----", req);
      let { accessToken, refreshToken } = await createAccessOrRefreshToken(
        user._id
      );
      const options = {
        httpOnly: true,
        secure: true,
      };
      const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
      );

      res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
          new ApiResponse(200, {
            accessToken: accessToken,
            refreshToken: refreshToken,
            user: loggedInUser,
          })
        );
    } catch (error) {
      throw new ApiError(
        501,
        "Something went wrong while authenticating via facebook"
      );
    }
  }
);
export default router;
