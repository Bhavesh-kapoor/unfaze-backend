import { Router } from "express";
import { register, validateRegister } from "../../controllers/admin/TherepistController.js";
import verifyJwtToken from "../../middleware/admin/auth.middleware.js";
import upload from "../../middleware/admin/multer.middleware.js";

const therepistRouter = Router();
const multipleImages = upload.fields([{ name: 'passport', maxCount: 1 }, { name: 'adharcard', maxCount: 1 }, { name: 'pancard', maxCount: 1 }]);

therepistRouter.post('/register', multipleImages, validateRegister, register);


export default therepistRouter;