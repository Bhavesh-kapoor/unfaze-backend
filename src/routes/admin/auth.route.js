import { Router } from "express";
import { login  ,register} from "../../controllers/admin/AuthController.js";
import verifyJwtToken from "../../middleware/admin/auth.middleware.js";
import speclizationRoute from "./specilization.route.js";

const authroutes =  Router();
authroutes.post('/login',login);
authroutes.post('/register',verifyJwtToken,register);
authroutes.use('/speclization',speclizationRoute);


export default authroutes;