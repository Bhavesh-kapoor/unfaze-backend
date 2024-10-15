import express from 'express';
import { registerUser, registerAdmin, validateRegister, allUserBycompany, allUser } from "../../controllers/corporate/corpController.js";
import { upload, compressImage } from '../../middleware/admin/multer.middleware.js';
import { allPackagesByOrg } from '../../controllers/corporate/packageController.js';
import { AllotSessionsTocorpUser, validate, editAllottedSessions, getAllottedSession, getList, deleteAllottedSessions } from '../../controllers/corporate/packageDistributionController.js';

const router = express.Router();
router.post("/admin-register", upload.single("userAvatarCorp"), compressImage, validateRegister, registerAdmin);
router.post("/user-register", upload.single("userAvatarCorp"), compressImage, validateRegister, registerUser)
router.post("/corp-user-by-company", allUserBycompany)
router.post("/all-corp-user", allUser);

/*------------------------------ package route for corp admin--------------------------*/
router.post("/package-list", allPackagesByOrg);



/*------------------------------ package distribution for corp admin--------------------------*/
router.post("/distribute-package", validate, AllotSessionsTocorpUser);
router.put("/edit-dist-package/:distributionId", validate, editAllottedSessions);
router.get("/get-dist-package/:userId?", getAllottedSession);
router.get("/get-list", getList);
router.delete("/delete-alloted-session/:distributionId", deleteAllottedSessions);


export default router;