import express from "express";
import { sendNewMessage, } from "../controllers/messageController";
const router = express.Router();
router.post("/send", sendNewMessage)
router.get("/:conversationId", getAllMessages)

export default router;