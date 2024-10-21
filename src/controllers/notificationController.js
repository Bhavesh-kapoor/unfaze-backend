import { Notification } from "../models/notification.Model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const sendNotification = async (receiverId, receiverType, message, payload) => {
  const notification = new Notification({
    receiverId,
    receiverType,
    message,
    payload,
  });
  const newNotification = await notification.save();
  return newNotification;
};

const getAllNotifications = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  try {
    const notifications = await Notification.find({ receiverId: userId, status: "unread" })
      .sort({ createdAt: -1 })
      .populate("sender", "name profilePic");
    res.status(200).json(new ApiResponse(200, notifications, "notifications fetched"));
  } catch (error) {
    console.error(error);
    res.status(500).json(new ApiResponse(500, null, "Server Error"));
  }
})
const markRead= asyncHandler(async(req,res)=>{
  try {
    const { userId } = req.user;
    await Notification.updateMany({ receiverId: userId, status: "unread" }, { status: "read" });
    res.status(200).json(new ApiResponse(200, null, "Notifications marked as read"));
  } catch (error) {
    console.error(error);
    res.status(500).json(new ApiResponse(500, null, "Server Error"));
  }
})
export { sendNotification, getAllNotifications };
