import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

let users = [];

// Add user to the users array
const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

// Remove user from the users array
const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

// Get user by userId
const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

export const configureSocket = (httpServer, app) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
    },
  });

  app.set("socketio", io);

  io.on("connection", (socket) => {
    socket.on("addUser", (userId) => {
      addUser(userId, socket.id);
      io.emit("getUsers", users);
    });

    // Send and receive messages
    socket.on("sendMessage", ({ senderId, receiverId, text, chatFile }) => {
      const user = getUser(receiverId);
      if (user) {
        io.to(user.socketId).emit("getMessage", {
          senderId,
          chatFile,
          text,
        });
      }
    });

    socket.on("typing", (receiverId) => {
      const user = getUser(receiverId);
      if (user) {
        io.to(user.socketId).emit("user-typing", { senderId: socket.id });
      }
    });
    socket.on("disconnect", () => {
      removeUser(socket.id);
      io.emit("getUsers", users);
    });
  });
};
