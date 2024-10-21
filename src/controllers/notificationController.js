import { populate } from "dotenv";
import { query, json } from "express";
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
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;
  try {
    const notifications = await Notification.find({ receiverId: userId, status: "unread" })
      .sort({ createdAt: -1 })
      .populate("sender", "name profilePic")
      .skip(skip)
      .limit(parseInt(limit));

    const totalNotifications = await Notification.countDocuments({ receiverId: userId, status: "unread" });
    res.status(200).json(new ApiResponse(200, {
      result: notifications,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalNotifications / limitNumber),
        totalItems: totalNotifications,
        itemsPerPage: limitNumber,
      },
    }, "Notifications fetched successfully"));
  } catch (error) {
    console.error(error);
    res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

const markRead = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.user;
    await Notification.updateMany({ receiverId: userId, status: "unread" }, { status: "read" });
    res.status(200).json(new ApiResponse(200, null, "Notifications marked as read"));
  } catch (error) {
    console.error(error);
    res.status(500).json(new ApiResponse(500, null, error.message));
  }
})
const getUnreadCount = asyncHandler(async (req, res) => {
  const user = req.user
  const unreadCount = await Notification.countDocuments({ receiverId: user._id, status: "unread" });
  res.status(200).json(new ApiResponse(200, { unreadCount }, "unread notifications count"));
})
export { sendNotification, getAllNotifications, markRead, getUnreadCount };
