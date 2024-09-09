import { Router } from "express";
import {
  allUser,
  createAdmin,
  deleteAdmin,
  getAdminDetails,
  getAllAdminList,
  updateAdminDetails,
} from "../../controllers/admin/user.controller.js";
import upload from "../../middleware/admin/multer.middleware.js";

const router = Router();

router.get("/user-list", allUser);

router.get("/admin-list", getAllAdminList);

router.post("/create", upload.single("profileImage"), createAdmin);

router.put("/update/:id", upload.single("profileImage"), updateAdminDetails);

router.delete("/delete/:_id", deleteAdmin);

router.get("/get-admin-details/:id", getAdminDetails);

export default router;
