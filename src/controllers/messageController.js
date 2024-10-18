import { Message } from "../models/messageModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../models/userModel.js";
import { Therapist } from "../models/therapistModel.js";
import { Session } from "../models/sessionsModel.js";
import { convertPathToUrl } from "./admin/TherepistController.js";
import path from 'path';
import fs, { read } from "fs"
import { fileURLToPath } from 'url';
import { json } from "express";
import { body, query } from "express-validator";
import { all } from "axios";
import { error } from "console";
import { push } from "firebase/database";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sendNewMessage = asyncHandler(async (req, res) => {
    const { receiverId } = req.params;
    const senderId = req.user?._id;
    let { message } = req.body;
    let chatFile
    if (req.file) {
        chatFile = convertPathToUrl(req.file.path)
    }
    if (!senderId || !receiverId) {
        return res.status(400).json({ error: "All fields are required" });
    }
    try {
        const chatMessage = new Message({
            senderId,
            receiverId,
            message,
            chatFile
        });
        await chatMessage.save();
        // const io = req.app.get("socketio");
        // io.to(receiverId).emit("receiveMessage", { senderId, message });
        res.status(201).json({ message: "Message sent successfully", chatMessage });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

const getChatHistory = asyncHandler(async (req, res) => {
    const { receiverId } = req.params;
    const senderId = req.user?._id;
    const { page = 1, limit = 20 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    try {
        const totalMessages = await Message.countDocuments({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId },
            ],
        });
        // Get the paginated messages
        const messages = await Message.find({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId },
            ],
        })
            .select("-createdAt -updatedAt")
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        if (!messages || messages.length === 0) {
            return res.status(404).json({ error: "No messages found" });
        }

        const formattedMessages = messages.map((message) => ({
            ...message._doc,
            isSender: message.senderId.toString() === senderId.toString(),
        }));
        const reversedMessages = formattedMessages.reverse();
        res.status(200).json({
            result: reversedMessages,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalMessages / limit),
                totalItems: totalMessages,
                itemsPerPage: limit,
            },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error fetching messages" });
    }
});
const getConversationList = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, search = '' } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        let userSearchIds = [];
        if (search) {
            const exactMatch = await User.findOne({ email: search }).select('_id');
            if (exactMatch) {
                userSearchIds.push(exactMatch._id);
            } else {
                const regex = new RegExp(search, 'i');
                const matchedUsers = await User.find({
                    $or: [
                        { firstName: regex },
                        { email: regex }
                    ],
                }).select('_id');
                userSearchIds = matchedUsers.map(u => u._id);
            }
        }

        const matchCondition = userSearchIds.length > 0
            ? {
                $or: [
                    { senderId: userId, receiverId: { $in: userSearchIds } },
                    { receiverId: userId, senderId: { $in: userSearchIds } }
                ]
            }
            : {
                $or: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            };

        const messages = await Message.aggregate([
            {
                $match: matchCondition,
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
                $skip: skip,
            },
            {
                $limit: limitNumber,
            },
            {
                $project: {
                    _id: 1,
                    lastMessageTime: 1,
                },
            },
        ]);

        if (!messages || messages.length === 0) {
            return res.status(404).json({ error: "No conversations found" });
        }

        const uniqueIds = messages.map((msg) => msg._id);

        const conversations = await User.find({ _id: { $in: uniqueIds } })
            .select('firstName lastName role email _id');

        const sortedConversations = await Promise.all(uniqueIds.map(async id => {
            const conversation = conversations.find(convo => convo._id.equals(id));

            // Find the last session of the user
            const lastSession = await Session.findOne({
                user_id: id,
                status: "completed"
            }).sort({ start_time: -1 }).select('start_time');
            const lastSessionTime = lastSession ? lastSession.start_time : null;

            // Count unread messages for each conversation
            const unreadCount = await Message.countDocuments({
                senderId: id,
                receiverId: userId,
                read: false,  
            });

            if (!conversation) {
                return { _id: id, name: "Unknown", role: "Unknown", email: "Unknown", lastSessionTime, unreadCount };
            }

            return {
                _id: conversation._id,
                name: `${conversation.firstName} ${conversation.lastName}`,
                role: conversation.role,
                email: conversation.email,
                lastSessionTime,
                unreadCount, 
            };
        }));

        const currentUser = {
            _id: req.user._id,
            name: `${req.user.firstName} ${req.user.lastName}`,
            role: req.user.role,
            email: req.user.email,
        };

        const totalConversations = await Message.aggregate([
            {
                $match: matchCondition,
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
                },
            },
        ]);

        const totalPages = Math.ceil(totalConversations.length / limitNumber);

        res.status(200).json(new ApiResponse(200, {
            userList: sortedConversations,
            currentUser,
            pagination: {
                itemsPerPage: limitNumber,
                totalItems: totalConversations.length,
                totalPages,
                currentPage: pageNumber,
            }
        }, "List fetched successfully"));

    } catch (error) {
        console.error("Error fetching conversation list:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};



const getAllConversationList = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        // Step 1: Search for users based on the search query
        let userSearchIds = [];
        if (search) {
            if (search.includes('@')) {
                const exactUserMatch = await User.findOne({ email: search }).select('_id');
                const exactTherapistMatch = await Therapist.findOne({ email: search }).select('_id');

                if (exactUserMatch) {
                    userSearchIds.push(exactUserMatch._id);
                }
                if (exactTherapistMatch) {
                    userSearchIds.push(exactTherapistMatch._id);
                }
            } else {
                const regex = new RegExp(search, 'i');
                const matchedUsers = await User.find({
                    $or: [
                        { firstName: regex },
                        { lastName: regex }
                    ],
                }).select('_id');

                const matchedTherapists = await Therapist.find({
                    $or: [
                        { firstName: regex },
                        { lastName: regex }
                    ],
                }).select('_id');

                userSearchIds = [
                    ...matchedUsers.map((u) => u._id),
                    ...matchedTherapists.map((t) => t._id),
                ];
            }
        }

        // Step 2: Modify message aggregation to group conversations uniquely
        const matchCondition = userSearchIds.length > 0
            ? {
                $or: [
                    { senderId: { $in: userSearchIds } },
                    { receiverId: { $in: userSearchIds } },
                ],
            }
            : {};

        const messages = await Message.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: {
                        pair: {
                            senderId: { $cond: { if: { $lt: ["$senderId", "$receiverId"] }, then: "$senderId", else: "$receiverId" } },
                            receiverId: { $cond: { if: { $lt: ["$senderId", "$receiverId"] }, then: "$receiverId", else: "$senderId" } }
                        }
                    },
                    lastMessageTime: { $last: "$timestamp" },
                    lastMessage: { $last: "$message" },
                    senderId: { $last: "$senderId" },
                    receiverId: { $last: "$receiverId" },
                },
            },
            { $sort: { lastMessageTime: -1 } },
            { $skip: skip },
            { $limit: limitNumber },
        ]);

        if (!messages || messages.length === 0) {
            return res.status(404).json({ error: "No conversations found" });
        }

        const uniqueIds = [
            ...new Set(messages.flatMap((msg) => [msg.senderId, msg.receiverId])),
        ];

        const users = await User.find({ _id: { $in: uniqueIds } }).select(
            "firstName lastName role _id"
        );
        const therapists = await Therapist.find({ _id: { $in: uniqueIds } }).select(
            "firstName lastName role _id"
        );

        const userMap = new Map();
        users.forEach((user) => {
            userMap.set(user._id.toString(), {
                id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                role: 'user',
            });
        });
        therapists.forEach((therapist) => {
            userMap.set(therapist._id.toString(), {
                id: therapist._id,
                name: `${therapist.firstName} ${therapist.lastName}`,
                role: 'therapist',
            });
        });

        const sortedConversations = messages.map((msg) => {
            const sender = userMap.get(msg.senderId.toString());
            const receiver = userMap.get(msg.receiverId.toString());

            let user = null;
            let therapist = null;

            // Check roles to assign user/therapist
            if (sender && sender.role === 'user') {
                user = sender;
                therapist = receiver && receiver.role === 'therapist' ? receiver : null;
            } else if (receiver && receiver.role === 'user') {
                user = receiver;
                therapist = sender && sender.role === 'therapist' ? sender : null;
            }

            return {
                conversationId: `${msg.senderId}-${msg.receiverId}`,
                userId: user ? user.id : null,
                userName: user ? user.name : "Unknown User",
                therapistId: therapist ? therapist.id : null,
                therapistName: therapist ? therapist.name : "Unknown Therapist",
                lastMessage: msg.lastMessage,
                lastMessageTime: msg.lastMessageTime,
            };
        });

        // Step 3: Get total count for pagination
        const totalConversations = await Message.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: {
                        pair: {
                            senderId: { $cond: { if: { $lt: ["$senderId", "$receiverId"] }, then: "$senderId", else: "$receiverId" } },
                            receiverId: { $cond: { if: { $lt: ["$senderId", "$receiverId"] }, then: "$receiverId", else: "$senderId" } }
                        }
                    },
                },
            },
        ]);

        const totalPages = Math.ceil(totalConversations.length / limitNumber);

        res.status(200).json(new ApiResponse(200, {
            result: sortedConversations,
            pagination: {
                itemsPerPage: limitNumber,
                totalItems: totalConversations.length,
                totalPages,
                currentPage: pageNumber,
            },
        }, "conversation list fatched!"));
    } catch (error) {
        console.error("Error fetching conversation list:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
const getChatHistoryForAdmin = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const participentArray = chatId.split("-");
    const { page = 1, limit = 20 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    try {
        // Find messages between the two participants and apply pagination
        const messages = await Message.find({
            $or: [
                { senderId: participentArray[0], receiverId: participentArray[1] },
                { senderId: participentArray[1], receiverId: participentArray[0] },
            ],
        })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limitNumber);

        const totalMessages = await Message.countDocuments({
            $or: [
                { senderId: participentArray[0], receiverId: participentArray[1] },
                { senderId: participentArray[1], receiverId: participentArray[0] },
            ],
        });
        const totalPages = Math.ceil(totalMessages / limitNumber);
        const formattedMessages = messages.map((message) => ({
            ...message._doc,
            isSender: message.senderId.toString() === participentArray[1].toString(),
        }));
        const reversedMessages = formattedMessages.reverse();
        res.status(200).json(new ApiResponse(200, {
            result: reversedMessages,
            pagination: {
                currentPage: pageNumber,
                totalPages,
                totalMessages,
                itemsPerPage: limitNumber,
            }
        }, "chat fatched successfully!"));
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error fetching messages" });
    }
});


const deleteMessagebyId = asyncHandler(async (req, res) => {
    const { _id } = req.params;

    try {
        // Find the message to get the image path
        const message = await Message.findById(_id);

        if (!message) {
            return res.status(200).json(new ApiResponse(200, null, "message not found"));
        }
        if (message.chatFile) {
            const imagePath = path.join(__dirname, '../images/chatFiles', path.basename(message.chatFile));

            fs.access(imagePath, fs.constants.F_OK, (err) => {
                if (!err) {
                    fs.unlink(imagePath, (unlinkError) => {
                        if (unlinkError) {
                            console.error('Error deleting image:', unlinkError);
                        }
                    });
                } else {
                    console.log('Image not found, nothing to delete:', imagePath);
                }
            });
        }

        const deletedMessage = await Message.findByIdAndDelete(_id);
        if (!deletedMessage) {
            return res.status(404).json({ error: "Something went wrong while deleting the chat" });
        }
        res.status(200).json(new ApiResponse(200, null, "message deleted successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiError(500, "Error deleting message"));
    }
});
const markMessagesAsRead = async (req, res) => {
    const { receiverId } = req.params;
    const user = req.user;
    const senderId = user?._id
    try {
        await Message.updateMany(
            { senderId: receiverId, receiverId: senderId, read: false },
            { $set: { read: true } }
        );
        res.status(200).json(new ApiResponse(200, null, "messages mark as read!"));
    } catch (err) {
        res.status(500).json(new ApiError(500, null, err.message));
    }
}
const getUnreadMessagesCount = asyncHandler(async (req, res) => {
    const { receiverId } = req.params;
    const user = req.user;
    const senderId = user?._id
    try {
        const unreadMessagesCount = await Message.countDocuments({ receiverId: senderId, senderId: receiverId, isRead: false });
        res.status(200).json(new ApiResponse(200, { unreadMessagesCount }, "unread messages count"));
    } catch (err) {
        res.status(500).json(ApiError(500, null, err.message));
    }
})

const geTherapistsforChat = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Current user's ID
  
    let pipeline = [
      {
        $match: {
          isActive: true,
        }
      },
      {
        $lookup: {
          from: "specializations",
          localField: "specialization",
          foreignField: "_id",
          as: "specializationDetails",
          pipeline: [
            {
              $project: {
                name: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "messages",
          let: { therapistId: "$_id" }, // Therapist ID
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $and: [{ $eq: ["$senderId", userId] }, { $eq: ["$receiverId", "$$therapistId"] }] },
                    { $and: [{ $eq: ["$senderId", "$$therapistId"] }, { $eq: ["$receiverId", userId] }] }
                  ]
                }
              }
            },
            {
              $sort: { timestamp: -1 } // Sort by the most recent message
            },
            {
              $group: {
                _id: null,
                lastMessageTime: { $first: "$timestamp" }, // Last message timestamp
                lastMessageText: { $first: "$message" }, // Last message text
                unreadCount: { $sum: { $cond: [{ $eq: ["$read", false] }, 1, 0] } } // Unread messages count
              }
            }
          ],
          as: "messageDetails"
        }
      },
      {
        $addFields: {
          lastMessageTime: { $arrayElemAt: ["$messageDetails.lastMessageTime", 0] },
          lastMessageText: { $arrayElemAt: ["$messageDetails.lastMessageText", 0] },
          unreadCount: { $ifNull: [{ $arrayElemAt: ["$messageDetails.unreadCount", 0] }, 0] } // Default to 0 if no messages
        }
      },
      {
        $sort: { lastMessageTime: -1 } // Sort by last message time (if exists), otherwise therapist remains in the list
      },
      {
        $project: {
          _id: 1,
          name: { $concat: ["$firstName", " ", "$lastName"] },
          bio: 1,
          category: "$specializationDetails",
          profileImageUrl: 1,
          lastMessageTime: 1,
          lastMessageText: 1,
          unreadCount: 1
        }
      }
    ];
  
    const user = {
      _id: req.user._id,
      email: req.user.email,
      fullName: `${req.user.firstName} ${req.user.lastName}`,
    };
  
    const therapistListData = await Therapist.aggregate(pipeline);
  
    if (!therapistListData.length) {
      return res.status(404).json(new ApiError(404, "", "No therapists found!"));
    }
  
    return res.status(200).json(
      new ApiResponse(200, { therapists: therapistListData, user }, "Therapist list fetched successfully")
    );
  });
  
export {
    sendNewMessage,
    getChatHistory,
    getConversationList,
    getAllConversationList,
    getChatHistoryForAdmin,
    deleteMessagebyId,
    markMessagesAsRead,
    getUnreadMessagesCount,
    geTherapistsforChat
};
