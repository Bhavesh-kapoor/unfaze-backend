import express from 'express';
import { registerUser, registerAdmin, validateRegister, allUserBycompany, allUser } from "../../controllers/corporate/corpController.js";
import { upload, compressImage } from '../../middleware/admin/multer.middleware.js';
const router = express.Router();
router.post("/admin-register", upload.single("userAvatarCorp"), compressImage, validateRegister, registerAdmin);
router.post("/user-register", upload.single("userAvatarCorp"), compressImage, validateRegister, registerUser)
router.post("/corp-user-by-company", allUserBycompany)
router.post("/all-corp-user", allUser)

export default router;