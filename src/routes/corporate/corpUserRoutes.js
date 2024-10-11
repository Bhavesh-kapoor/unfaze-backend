import express from 'express';
import { register } from "../../controllers/corporate/corpController.js";
import { upload, compressImage } from '../../middleware/admin/multer.middleware.js';
const router = express.Router();
router.post("/register", upload.single("userAvatarCorp"), compressImage, register)

export default router