import { Router } from "express";
import { activateOrDeactivate, getAllTherepist, register, validateRegister } from "../../controllers/admin/TherepistController.js";
import verifyJwtToken from "../../middleware/admin/auth.middleware.js";
import upload from "../../middleware/admin/multer.middleware.js";

const therepistRouter = Router();
const multipleImages = upload.fields([{ name: 'passport', maxCount: 1 }, { name: 'adharcard', maxCount: 1 }, { name: 'pancard', maxCount: 1 }]);

therepistRouter.post('/register', verifyJwtToken, multipleImages, validateRegister, register);
therepistRouter.post('/activate-or-deactive', verifyJwtToken, activateOrDeactivate);
therepistRouter.get('/all',  getAllTherepist);


export default therepistRouter;