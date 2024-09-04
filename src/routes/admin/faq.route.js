import { Router } from "express";
import {
  read,
  store,
  update,
  getById,
  deleteFaq,
  validateFaq,
} from "../../controllers/admin/FaqController.js";

const router = Router();

router.get("/all", read);

router.get("/get-one/:_id", getById);

router.delete("/delete/:_id", deleteFaq);

router.post("/store", validateFaq, store);

router.put("/update/:id", validateFaq, update);

export default router;
