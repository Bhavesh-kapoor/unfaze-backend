import express from "express";
import { sendNewMessage, getChatHistory, getConversationList, getAllConversationList, getChatHistoryForAdmin, deleteMessagebyId, markMessagesAsRead, getUnreadMessagesCount, geTherapistsforChat } from "../controllers/messageController.js";
// import { geTherapistsforChat } from "../controllers/admin/transactionsController.js";
import { upload } from "../middleware/admin/multer.middleware.js";
const router = express.Router();
router.post("/send/:receiverId", upload.single("chatFile"), sendNewMessage)
router.put("/mark-read/:receiverId", markMessagesAsRead)
router.post("/unread-msg-count/:receiverId", getUnreadMessagesCount)
router.get("/chatHistory/:receiverId", getChatHistory);
router.get("/conversations", getConversationList);
router.get("/all-conversations", getAllConversationList);
router.get("/chat-history/:participent1/:participent2", getChatHistoryForAdmin);
router.delete("/delete-message/:_id", deleteMessagebyId);
router.get("/therapistlist", geTherapistsforChat);

export default router;