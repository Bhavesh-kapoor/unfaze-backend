import { Router } from "express";
import {
  activateOrDeactivate,
  getAllTherepist,
  register,
  validateRegister,
  login,
  logout,
  getCurrentUser,
  updateTherapist,
} from "../../controllers/admin/TherepistController.js";
import verifyJwtToken from "../../middleware/admin/auth.middleware.js";
import upload from "../../middleware/admin/multer.middleware.js";

const therapistAuth = Router();
const multipleImages = upload.fields([
  { name: "passport", maxCount: 1 },
  { name: "adharcard", maxCount: 1 },
  { name: "pancard", maxCount: 1 },
]);

therapistAuth.post("/register", multipleImages, validateRegister, register);
therapistAuth.post("/login", validateRegister, login);
therapistAuth.post("/logout", verifyJwtToken, logout);
therapistAuth.get("/current-user", verifyJwtToken, getCurrentUser);
therapistAuth.put("/update-profile",verifyJwtToken, multipleImages, updateTherapist);


therapistAuth.post(
  "/activate-or-deactive/:_id",
  verifyJwtToken,
  activateOrDeactivate
);
therapistAuth.get("/all", verifyJwtToken, getAllTherepist);

export default therapistAuth;
