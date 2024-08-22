import { Router } from "express";
import {
  activateOrDeactivate,
  therapistList,
  register,
  validateRegister,
  login,
  logout,
  getCurrentUser,
  updateTherapist,
  updateAvatar
} from "../../controllers/admin/TherepistController.js";
import verifyJwtToken from "../../middleware/admin/auth.middleware.js";
import upload from "../../middleware/admin/multer.middleware.js";
import { getTherepistById } from "../../controllers/admin/TherepistController.js";

const therapistAuth = Router();
const multipleImages = upload.fields([
  { name: "passport", maxCount: 1 },
  { name: "adharcard", maxCount: 1 },
  { name: "pancard", maxCount: 1 },
  { name: "profileImage", maxCount: 1 },
]);

therapistAuth.post("/register", multipleImages, validateRegister, register);
therapistAuth.post("/login", validateRegister, login);
therapistAuth.post("/logout", verifyJwtToken, logout);
therapistAuth.get("/current-user", verifyJwtToken, getCurrentUser);
therapistAuth.patch("/update-profile",verifyJwtToken, multipleImages, updateTherapist);
therapistAuth.patch("/update-avatar",verifyJwtToken, upload.single('profileImage'),updateAvatar);



therapistAuth.post(
  "/activate-or-deactive/:_id",
  verifyJwtToken,
  activateOrDeactivate
);
therapistAuth.get("/therapists-list", therapistList);
therapistAuth.get("/get-therapist/:_id", verifyJwtToken,getTherepistById);

export default therapistAuth;
