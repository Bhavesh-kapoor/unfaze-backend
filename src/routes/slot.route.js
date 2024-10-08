import { Router } from "express";
import {
  createSlots,
  updateSlot,
  deleteSlot,
  addMoreSlots,
  getNext10DaysSlots,
} from "../controllers/slotController.js";

const router = Router();

router.get("/list/:id?", getNext10DaysSlots);

router.post("/create", createSlots);

router.post("/add-slots", addMoreSlots);

router.put("/update-slot", updateSlot);

router.delete("/delete-slot", deleteSlot);

export default router;
