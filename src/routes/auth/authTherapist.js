// authRoutes.js
import express from "express";
import passport from "../../config/passportTherapist.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import { Therapist } from "../../models/therepistModel.js";

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
  "/therapist/google",
  passport.authenticate("google-therapist", { scope: ["profile", "email"] })
);
router.get(
  "/therapist/google/callback",
  passport.authenticate("google-therapist", {
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
      const loggedInUser = await Therapist.findById(user._id).select(
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
  "/therapist/facebook",
  passport.authenticate("facebook-therapist", { scope: ["email"] })
);

router.get(
  "/therapist/facebook/callback",
  passport.authenticate("facebook-therapist", {
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
      const loggedInUser = await Therapist.findById(user._id).select(
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
