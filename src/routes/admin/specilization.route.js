import { Router } from "express";
import { createSpecilization, getAllSpeziliation } from "../../controllers/admin/SpecilizationController.js";
import verifyJwtToken from "../../middleware/admin/auth.middleware.js";
let speclizationRoute =  Router();


speclizationRoute.get('/all',verifyJwtToken, getAllSpeziliation);
speclizationRoute.get('/create',verifyJwtToken, createSpecilization);

export default speclizationRoute;

