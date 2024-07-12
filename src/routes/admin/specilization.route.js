import { Router } from "express";
import { createSpecilization, getAllSpeziliation,updateSpecilization,deleteSpeclization } from "../../controllers/admin/SpecilizationController.js";
import verifyJwtToken from "../../middleware/admin/auth.middleware.js";
let speclizationRoute =  Router();


speclizationRoute.get('/all',verifyJwtToken, getAllSpeziliation);
speclizationRoute.get('/create',verifyJwtToken, createSpecilization);
speclizationRoute.post('/update',verifyJwtToken, updateSpecilization);
speclizationRoute.post('/delete',verifyJwtToken, deleteSpeclization);

export default speclizationRoute;

