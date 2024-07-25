import { Router } from "express";
import verifyJwtToken from "../../middleware/admin/auth.middleware.js";
import { register,refreshToken,login } from "../../controllers/admin/user.controller.js";
import speclizationRoute from "../admin/specilization.route.js";
import feedbackRoute from "../feeback.route.js";

const userRoutes = Router();
userRoutes.post("/register", register);
userRoutes.post('/login',login);
userRoutes.post('/refreshToken',verifyJwtToken,  refreshToken);
userRoutes.use('/specialization',verifyJwtToken , speclizationRoute);
userRoutes.use('/feedback',feedbackRoute);


export default userRoutes;
