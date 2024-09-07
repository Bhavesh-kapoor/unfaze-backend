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
  updateAvatar,
} from "../../controllers/admin/TherepistController.js";
import upload from "../../middleware/admin/multer.middleware.js";
import { getTherepistById } from "../../controllers/admin/TherepistController.js";
import { getTherapistRevenue, getTherapistSessions } from "../../controllers/admin/transactionsController.js";

const router = Router();
const multipleImages = upload.fields([
  { name: "passport", maxCount: 1 },
  { name: "adharcard", maxCount: 1 },
  { name: "pancard", maxCount: 1 },
  { name: "profileImage", maxCount: 1 },
]);

router.post("/logout", logout);

router.get("/current-user", getCurrentUser);

router.post("/login", validateRegister, login);

router.get("/therapists-list", therapistList);

router.get("/get-therapist/:_id", getTherepistById);

router.post("/activate-or-deactive/:_id", activateOrDeactivate);

router.post("/register", multipleImages, validateRegister, register);

router.patch("/update-profile", multipleImages, updateTherapist);

router.patch("/update-avatar", upload.single("profileImage"), updateAvatar);
router.get("/get-therapist-revenue", getTherapistRevenue);
router.get("/get-sessions", getTherapistSessions);


export default router;
