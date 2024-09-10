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

export { sendNotification };
