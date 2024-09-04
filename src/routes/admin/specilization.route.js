import { Router } from "express";
import {
  createSpecialization,
  getAllSpecialization,
  updateSpecialization,
  deleteSpecialization,
} from "../../controllers/admin/SpecilizationController.js";

let router = Router();

router.get("/all", getAllSpecialization);

router.post("/create", createSpecialization);

router.put("/update/:_id", updateSpecialization);

router.delete("/delete/:_id", deleteSpecialization);

export default router;
