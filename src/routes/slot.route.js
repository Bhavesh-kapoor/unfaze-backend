import { Router } from "express";
import {
  createSlots,
  updateSlot,
  deleteSlot,
  addMoreSlots,
  getSlotsByDate,
  getNext10DaysSlots,
} from "../controllers/slotController.js";

const router = Router();

router.get("/list/:therapist_id/:date", getSlotsByDate);

router.get("/list", getNext10DaysSlots);

router.post("/create", createSlots);

router.post("/add-slots", addMoreSlots);

router.put("/update-slot", updateSlot);

router.delete("/delete-slot", deleteSlot);

export default router;
