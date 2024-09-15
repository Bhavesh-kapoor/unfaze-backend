import { Router } from "express";
import {
  login,
  logout,
  register,
  dashboard,
  updateAvatar,
  therapistList,
  getCurrentUser,
  updateTherapist,
  validateRegister,
  activateOrDeactivate,
} from "../../controllers/admin/TherepistController.js";
import upload from "../../middleware/admin/multer.middleware.js";
import { getTherepistById } from "../../controllers/admin/TherepistController.js";
import {
  getTherapistRevenue,
  getTherapistSessions,
  therapistTransactions,
} from "../../controllers/admin/transactionsController.js";

const router = Router();
const multipleImages = upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "highschoolImg", maxCount: 1 },
  { name: "graduationImg", maxCount: 1 },
  { name: "intermediateImg", maxCount: 1 },
  { name: "postGraduationImg", maxCount: 1 },
]);

router.post("/logout", logout);

router.get("/dashboard", dashboard);

router.get("/current-user", getCurrentUser);

router.get("/therapists-list", therapistList);

router.post("/login", validateRegister, login);

router.get("/get-sessions", getTherapistSessions);

router.get("/get-therapist/:_id", getTherepistById);

router.get("/get-transactions", therapistTransactions);

router.get("/get-therapist-revenue", getTherapistRevenue);

router.put("/update-profile", multipleImages, updateTherapist);

router.post("/activate-or-deactive/:_id", activateOrDeactivate);

router.post("/register", multipleImages, validateRegister, register);

router.patch("/update-avatar", upload.single("profileImage"), updateAvatar);

export default router;
