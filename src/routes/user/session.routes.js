import { Router } from "express";
import {
  bookaSession,
  availableSlots,
  bookedSessions,

} from "../../controllers/admin/sessionsControllers.js";
import verifyJwtToken from "../../middleware/admin/auth.middleware.js";
import { generateSessionToken } from "../../controllers/agora.js";

const sessionRouter = Router();
sessionRouter.post("/book-session", verifyJwtToken, bookaSession);
sessionRouter.get("/booked-sessions", verifyJwtToken, bookedSessions);
sessionRouter.get("/available_slots", verifyJwtToken, availableSlots);
sessionRouter.get("/agora-token", verifyJwtToken, generateSessionToken)

export default sessionRouter;
