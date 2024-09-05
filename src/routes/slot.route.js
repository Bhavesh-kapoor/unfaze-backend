import { Router } from "express";
import {
  createSlots,
  updateSlot,
  deleteSlot,
  addMoreSlots,
  getSlotsByDate,
} from "../controllers/slotController.js";

const router = Router();

router.get("/list/:therapist_id/:date", getSlotsByDate);

router.post("/create", createSlots);

router.post("/add-slots", addMoreSlots);

router.put("/update-slot", updateSlot);

router.delete("/delete-slot", deleteSlot);

export default router;
