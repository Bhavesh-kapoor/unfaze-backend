import { Message } from "../models/messageModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const sendNewMessage = asyncHandler(async (req, res) => {
    const { conversationId, senderId, text } = req.body
    const newMessage = new Message({ conversationId, senderId, text });
    try {
        const savedMessage = await newMessage.save();
        res.status(200).json(savedMessage);
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiError(500, "something went wrong ", error));
    }
})

const getAllMessages = asyncHandler(async (req, res) => {
    const { conversationId } = req.params
    try {
        const messages = await Message.find({
            conversationId: conversationId,
        });
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json(err);
    }
})

export {sendNewMessage, getAllMessages};