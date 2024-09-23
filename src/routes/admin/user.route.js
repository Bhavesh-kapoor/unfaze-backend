import { Router } from "express";
import {
  allUser,
  createAdmin,
  deleteAdmin,
  getAdminDetails,
  getAllAdminList,
  getUserDetails,
  updateAdminDetails,
} from "../../controllers/admin/user.controller.js";
import {
  upload,
  compressImage,
} from "../../middleware/admin/multer.middleware.js";

const router = Router();

router.get("/user-list", allUser);

router.get("/admin-list", getAllAdminList);

router.post(
  "/create",
  upload.single("profileImage"),
  compressImage,
  createAdmin
);

router.put(
  "/update/:id",
  upload.single("profileImage"),
  compressImage,
  updateAdminDetails
);

router.delete("/delete/:_id", deleteAdmin);

router.get("/get-admin-details/:id", getAdminDetails);

router.get("/get-user-details/:id", getUserDetails);

export default router;
