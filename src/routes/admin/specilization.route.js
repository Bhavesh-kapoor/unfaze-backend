import { Router } from "express";
import {
  createSpecialization,
  getAllSpecialization,
  updateSpecialization,
  deleteSpecialization,
} from "../../controllers/admin/SpecilizationController.js";
import verifyJwtToken from "../../middleware/admin/auth.middleware.js";
let specializationRoute = Router();

specializationRoute.get("/all", getAllSpecialization);
specializationRoute.post("/create", verifyJwtToken, createSpecialization);
specializationRoute.put("/update/:_id", verifyJwtToken, updateSpecialization);
specializationRoute.delete("/delete/:_id", verifyJwtToken, deleteSpecialization);

export default specializationRoute;
