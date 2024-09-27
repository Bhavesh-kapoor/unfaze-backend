import { Message } from "../models/messageModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../models/userModel.js";
import { Therapist } from "../models/therapistModel.js";

const sendNewMessage = asyncHandler(async (req, res) => {
    const { receiverId } = req.params;
    const senderId = req.user?._id
    const { message } = req.body;

    if (!senderId || !receiverId || !message) {
        return res.status(400).json({ error: "All fields are required" });
    }
    try {
        const chatMessage = new Message({
            senderId,
            receiverId,
            message,
        });

        await chatMessage.save();

        // // Emit the message via Socket.IO if needed
        // const io = req.app.get("socketio");
        // io.to(receiverId).emit("receiveMessage", { senderId, message });

        res.status(201).json({ message: "Message sent successfully", chatMessage });
    } catch (error) {
        res.status(500).json({ error: "Error sending message" });
    }
});

const getChatHistory = asyncHandler(async (req, res) => {
    const { receiverId } = req.params;
    const senderId = req.user?._id

    try {
        const messages = await Message.find({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId },
            ],
        }).sort({ timestamp: 1 });
        res.status(200).json(messages);
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Error fetching messages" });
    }
});


const getConversationList = async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role;

        const messages = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: userId },
                        { receiverId: userId },
                    ],
                },
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$senderId", userId] },
                            "$receiverId",
                            "$senderId",
                        ],
                    },
                    lastMessageTime: { $max: "$timestamp" },
                },
            },
            {
                $sort: { lastMessageTime: -1 }, 
            },
            {
                $project: {
                    _id: 1,  
                    lastMessageTime: 1,
                },
            },
        ]);

        const uniqueIds = messages.map(msg => msg._id);

        let conversations;
        if (userRole === 'user') {
            conversations = await Therapist.find({ _id: { $in: uniqueIds } })
                .select('firstName lastName role');
        } else {
            conversations = await User.find({ _id: { $in: uniqueIds } })
                .select('firstName lastName role');
        }

        const sortedConversations = uniqueIds.map(id => {
            const conversation = conversations.find(conversation => conversation._id.equals(id));
            return {
                _id: conversation._id,
                name: `${conversation.firstName} ${conversation.lastName}`,
                role: conversation.role
            };
        });

        res.status(200).json(sortedConversations);
    } catch (error) {
        console.error("Error fetching conversation list:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export { sendNewMessage, getChatHistory, getConversationList };
