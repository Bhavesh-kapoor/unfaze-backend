import express from 'express';
import { registerUser, registerAdmin, validateRegister } from "../../controllers/corporate/corpController.js";
import { upload, compressImage } from '../../middleware/admin/multer.middleware.js';
const router = express.Router();
router.post("/admin-register", upload.single("userAvatarCorp"), compressImage, validateRegister, registerAdmin);
router.post("/user-register", upload.single("userAvatarCorp"), compressImage, validateRegister, registerUser)


export default router;