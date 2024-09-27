import express from "express";
import { sendNewMessage, getChatHistory, getConversationList } from "../controllers/messageController.js";
const router = express.Router();
router.post("/send/:receiverId", sendNewMessage)
router.get("/chatHistory/:receiverId", getChatHistory);
router.get("/conversations", getConversationList);

export default router;