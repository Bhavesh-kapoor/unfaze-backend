import express from 'express';
import { registerUser } from "../../controllers/corporate/corpController.js";
import { upload, compressImage } from '../../middleware/admin/multer.middleware.js';
const router = express.Router();
router.post("/user-register", upload.single("userAvatarCorp"), compressImage, registerUser);

export default router;