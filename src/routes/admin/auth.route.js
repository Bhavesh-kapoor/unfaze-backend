import { Router } from "express";
import { login  ,refreshToken,register} from "../../controllers/admin/AuthController.js";
import verifyJwtToken from "../../middleware/admin/auth.middleware.js";
import speclizationRoute from "./specilization.route.js";
import therepistRouter from "./therepist.route.js";
import feedbackRoute from "../feeback.route.js";
import blogsrouter from "./blogs.route.js";
import categoryRouter from "./blogCategory.route.js";

const authroutes =  Router();
authroutes.post('/login',login);
authroutes.post('/register',verifyJwtToken , register);
authroutes.post('/refreshToken',verifyJwtToken,  refreshToken);
authroutes.use('/speclization',verifyJwtToken , speclizationRoute);
authroutes.use('/therepist',verifyJwtToken, therepistRouter);
authroutes.use('/feedback',feedbackRoute);
authroutes.use('/blogs', blogsrouter);
authroutes.use('/category',verifyJwtToken ,categoryRouter);


export default authroutes;