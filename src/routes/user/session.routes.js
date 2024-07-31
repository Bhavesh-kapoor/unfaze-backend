import { Router } from "express";
import {
  bookaSession,
  availableSlots,
} from "../../controllers/admin/sessionsControllers.js";
import verifyJwtToken from "../../middleware/admin/auth.middleware.js";

const sessionRouter = Router();
sessionRouter.post("/book-session", verifyJwtToken, bookaSession);
sessionRouter.get("/available_slots", verifyJwtToken, availableSlots);

export default sessionRouter;
