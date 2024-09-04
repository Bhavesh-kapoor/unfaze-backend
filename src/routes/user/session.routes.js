import { Router } from "express";
import { generateSessionToken } from "../../controllers/agora.js";
import {
  bookaSession,
  availableSlots,
  bookedSessions,
} from "../../controllers/admin/sessionsControllers.js";

const router = Router();

router.post("/book-session", bookaSession);

router.get("/booked-sessions", bookedSessions);

router.get("/available_slots", availableSlots);

router.get("/agora-token", generateSessionToken);

export default router;
