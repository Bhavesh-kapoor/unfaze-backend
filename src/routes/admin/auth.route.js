import { Router } from "express";
import { login  ,register} from "../../controllers/admin/AuthController.js";
import verifyJwtToken from "../../middleware/admin/auth.middleware.js";
import speclizationRoute from "./specilization.route.js";
import therepistRouter from "./therepist.route.js";
import feedbackRoute from "../feeback.route.js";

const authroutes =  Router();
authroutes.post('/login',login);
authroutes.post('/register',register);
authroutes.use('/speclization',speclizationRoute);
authroutes.use('/therepist',therepistRouter);
authroutes.use('/feedback',feedbackRoute);

export default authroutes;