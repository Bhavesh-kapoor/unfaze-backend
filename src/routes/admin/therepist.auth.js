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
  deleteTherapistByID,
  setNewPasswrd,
} from "../../controllers/admin/TherepistController.js";
import {
  upload,
  compressImage,
} from "../../middleware/admin/multer.middleware.js";
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

router.get("/dashboard/:id?", dashboard);

router.get("/current-user", getCurrentUser);

router.get("/therapists-list", therapistList);

router.post("/login", validateRegister, login);

router.get("/get-sessions", getTherapistSessions);

router.delete("/delete/:_id", deleteTherapistByID);

router.get("/get-therapist/:_id", getTherepistById);

router.get("/get-transactions", therapistTransactions);

router.get("/get-therapist-revenue", getTherapistRevenue);

router.put("/update-profile", multipleImages, compressImage, updateTherapist);

router.post("/activate-or-deactive/:_id", activateOrDeactivate);

router.post(
  "/register",
  multipleImages,
  compressImage,
  validateRegister,
  register
);

router.patch("/update-avatar", upload.single("profileImage"), updateAvatar);
router.put("/set-new-password", setNewPasswrd);

export default router;
