import { Notification } from "../models/notification.Model.js";
import { getUnreadCount, getAllNotifications, markRead } from "../controllers/notificationController.js";
import express from "express";
const router = express.Router();
router.get('/get-all', getAllNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/mark-read', markRead);
router
export default router;