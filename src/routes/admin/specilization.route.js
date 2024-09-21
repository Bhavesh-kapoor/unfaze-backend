import { Router } from "express";
import {
  createSpecialization,
  getAllSpecialization,
  updateSpecialization,
  deleteSpecialization,
  getSpecializationById
} from "../../controllers/admin/SpecilizationController.js";

let router = Router();

router.get("/all", getAllSpecialization);

router.get("/get/:_id", getSpecializationById);

router.post("/create", createSpecialization);

router.put("/update/:_id", updateSpecialization);

router.delete("/delete/:_id", deleteSpecialization);

export default router;
