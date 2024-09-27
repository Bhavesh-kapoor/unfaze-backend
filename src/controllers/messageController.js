import { Message } from "../models/messageModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const sendNewMessage = asyncHandler(async (req, res) => {
  const { senderId, receiverId, message } = req.body;

  if (!senderId || !receiverId || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Save the message to the database
    const chatMessage = new ChatMessage({
      senderId,
      receiverId,
      message,
    });

    await chatMessage.save();

    // Emit the message via Socket.IO if needed
    const io = req.app.get("socketio");
    io.to(receiverId).emit("receiveMessage", { senderId, message });

    res.status(201).json({ message: "Message sent successfully", chatMessage });
  } catch (error) {
    res.status(500).json({ error: "Error sending message" });
  }
});

const getAllMessages = asyncHandler(async (req, res) => {
  const { senderId, receiverId } = req.params;
  try {
    const messages = await ChatMessage.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Error fetching messages" });
  }
});

export { sendNewMessage, getAllMessages };
