import { Router } from "express";
import {
  createSpecialization,
  getAllSpecialization,
  updateSpecialization,
  deleteSpeclization,
} from "../../controllers/admin/SpecilizationController.js";
import verifyJwtToken from "../../middleware/admin/auth.middleware.js";
let speclizationRoute = Router();

speclizationRoute.get("/all", verifyJwtToken, getAllSpecialization);
speclizationRoute.post("/create", verifyJwtToken, createSpecialization);
speclizationRoute.put("/update/:_id", verifyJwtToken, updateSpecialization);
speclizationRoute.delete("/delete/:_id", verifyJwtToken, deleteSpeclization);

export default speclizationRoute;
