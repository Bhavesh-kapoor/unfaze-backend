import { Message } from "../models/messageModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../models/userModel.js";
import { Therapist } from "../models/therapistModel.js";

const sendNewMessage = asyncHandler(async (req, res) => {
  const { receiverId } = req.params;
  const senderId = req.user?._id;
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
    // const io = req.app.get("socketio");
    // io.to(receiverId).emit("receiveMessage", { senderId, message });
    res.status(201).json({ message: "Message sent successfully", chatMessage });
  } catch (error) {
    res.status(500).json({ error: "Error sending message" });
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
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(limit);

    if (!messages || messages.length === 0) {
      return res.status(404).json({ error: "No messages found" });
    }

    const formattedMessages = messages.map((message) => ({
      ...message._doc,
      isSender: message.senderId.toString() === senderId.toString(),
    }));
    res.status(200).json({
      result: formattedMessages,
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
    const userRole = req.user.role;
    // Pagination parameters
    const page = parseInt(req.query.page) || 1; // Current page, default is 1
    const limit = parseInt(req.query.limit) || 10; // Limit of items per page, default is 10
    const skip = (page - 1) * limit; // Number of items to skip

    // Aggregation to group conversations
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$senderId", userId] }, "$receiverId", "$senderId"],
          },
          lastMessageTime: { $max: "$timestamp" },
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
      {
        $skip: skip, // Skip the previous pages
      },
      {
        $limit: limit, // Limit the number of conversations per page
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

    // Fetching conversations based on user role
    let conversations = [];

    if (userRole === "user" || userRole === "admin") {
      // Fetch therapists
      conversations = await Therapist.find({ _id: { $in: uniqueIds } }).select(
        "firstName lastName role email"
      );
    } else {
      // Fetch users
      conversations = await User.find({ _id: { $in: uniqueIds } }).select(
        "firstName lastName role email"
      );
    }

    // Sorting conversations and handling missing data
    const sortedConversations = uniqueIds.map((id) => {
      const conversation = conversations.find((convo) =>
        convo?._id?.equals(id)
      );

      // Handle case if conversation is not found
      if (!conversation) {
        return { _id: id, name: "Unknown", role: "Unknown", email: "Unknown" };
      }

      return {
        _id: conversation._id,
        name: `${conversation.firstName} ${conversation.lastName}`,
        role: conversation.role,
        email: conversation.email,
      };
    });

    // Include current user details
    const currentUser = {
      _id: req.user._id,
      name: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
      email: req.user.email,
    };

    // Get total count of conversations for pagination
    const totalConversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$senderId", userId] }, "$receiverId", "$senderId"],
          },
        },
      },
    ]);
    const totalPages = Math.ceil(totalConversations.length / limit);
    res.status(200).json(
      new ApiResponse(200, {
        userList: sortedConversations,
        currentUser,
        pagination: {
          itemsPerPage: limit,
          totalItems: totalConversations.length,
          totalPages,
          currentPage: page,
        },
      })
    );
  } catch (error) {
    console.error("Error fetching conversation list:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllConversationList = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $gt: ["$senderId", "$receiverId"] },
              {
                $concat: [
                  { $toString: "$receiverId" },
                  "-",
                  { $toString: "$senderId" },
                ],
              },
              {
                $concat: [
                  { $toString: "$senderId" },
                  "-",
                  { $toString: "$receiverId" },
                ],
              },
            ],
          },
          lastMessageTime: { $last: "$timestamp" },
          lastMessage: { $last: "$message" },
          senderId: { $last: "$senderId" },
          receiverId: { $last: "$receiverId" },
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
    ]);

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
        role: user.role,
      });
    });
    therapists.forEach((therapist) => {
      userMap.set(therapist._id.toString(), {
        id: therapist._id,
        name: `${therapist.firstName} ${therapist.lastName}`,
        role: therapist.role,
      });
    });

    const sortedConversations = messages.map((msg) => {
      const sender = userMap.get(msg.senderId.toString());
      const receiver = userMap.get(msg.receiverId.toString());

      return {
        conversationId: msg._id,
        participant1: {
          role: sender ? sender.role : "Unknown",
          id: sender ? sender.id : null,
          name: sender ? sender.name : "Unknown Sender",
        },
        participant2: {
          role: receiver ? receiver.role : "Unknown",
          id: receiver ? receiver.id : null,
          name: receiver ? receiver.name : "Unknown Receiver",
        },
        lastMessage: msg.lastMessage,
        lastMessageTime: msg.lastMessageTime,
      };
    });

    res.status(200).json(sortedConversations);
  } catch (error) {
    console.error("Error fetching conversation list:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
const getchatHistoryForAdmin = asyncHandler(async (req, res) => {
  const { participent1, participent2 } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { senderId: participent1, receiverId: participent2 },
        { senderId: participent2, receiverId: participent1 },
      ],
    }).sort({ timestamp: 1 });
    res.status(200).json(messages);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching messages" });
  }
});
const deleteMessagebyId = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  try {
    const deletedMessage = await Message.findByIdAndDelete(_id);
    if (!deletedMessage) {
      return res
        .status(404)
        .json({ error: "something went wrong while deleting the chat" });
    }
    console.log(deletedMessage);
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error deleting message" });
  }
});

export {
  sendNewMessage,
  getChatHistory,
  getConversationList,
  getAllConversationList,
  getchatHistoryForAdmin,
  deleteMessagebyId,
};
