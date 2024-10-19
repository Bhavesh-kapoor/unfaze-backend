import express from 'express';
import { registerUser, registerAdmin, validateRegister, allUserBycompany, allUser, getCorpAdminList, getUserDetails, deleteUser, corpAdminDashboard, sendUrlManully, updateProfile } from "../../controllers/corporate/corpController.js";
import { upload, compressImage } from '../../middleware/admin/multer.middleware.js';
import { allPackagesByOrg } from '../../controllers/corporate/packageController.js';
import { AllotSessionsTocorpUser, validate, getById, editAllottedSessions, getAllottedSession, getList, deleteAllottedSessions, } from '../../controllers/corporate/packageDistributionController.js';

const router = express.Router();
router.post("/admin-register", upload.single("userAvatarCorp"), compressImage, validateRegister, registerAdmin);
router.post("/user-register", upload.single("userAvatarCorp"), compressImage, validateRegister, registerUser);
router.put("/user-update/:userId", upload.single("userAvatarCorp"), compressImage, validateRegister, updateProfile);
router.get("/corp-user-by-company", allUserBycompany)
router.get("/all-corp-user", allUser);
router.get("/all-corp-admin", getCorpAdminList);
router.get("/details/:id", getUserDetails);
router.delete("/delete-user/:id", deleteUser);
router.get("/send-pw-reset-link/:id", sendUrlManully);


/*------------------------------ package route for corp admin--------------------------*/
router.get("/package-list", allPackagesByOrg);



/*------------------------------ package distribution for corp admin--------------------------*/
router.post("/distribute-package", validate, AllotSessionsTocorpUser);
router.get("/get-by-id/:id", getById);
router.put("/edit-dist-package/:distributionId", validate, editAllottedSessions);
router.get("/get-dist-package/:userId?", getAllottedSession);
router.get("/get-list", getList);
router.delete("/delete-alloted-session/:distributionId", deleteAllottedSessions);

/*------------------------------ Dashboard--------------------------*/
router.get("/dashboard", corpAdminDashboard)

export default router;