import { Router } from "express";
import { generateSessionToken } from "../../controllers/agora.js";
import {
 sessionCompleted 
} from "../../controllers/admin/sessionsControllers.js";

const router = Router();

// router.post("/book-session", bookaSession);

// router.get("/booked-sessions", bookedSessions);

// router.get("/available_slots", availableSlots);

router.get("/agora-token", generateSessionToken);
router.get("/session-completed/:sessionId", sessionCompleted);

export default router;
