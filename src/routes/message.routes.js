import express from "express";
import { sendNewMessage, getChatHistory, getConversationList, getAllConversationList, getChatHistoryForAdmin, deleteMessagebyId } from "../controllers/messageController.js";
import { geTherapistsforChat } from "../controllers/admin/transactionsController.js";
const router = express.Router();
router.post("/send/:receiverId", sendNewMessage)
router.get("/chatHistory/:receiverId", getChatHistory);
router.get("/conversations", getConversationList);
router.get("/all-conversations", getAllConversationList);
router.get("/chat-history/:participent1/:participent2", getChatHistoryForAdmin);
router.delete("/delete-message/:_id", deleteMessagebyId);
router.get("/therapistlist", geTherapistsforChat);

export default router;