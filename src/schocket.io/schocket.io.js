
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();

const users = {}; 

export const configureSocket = (httpServer, app) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
    },
  });

  app.set("socketio", io);

  io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);

    socket.on("register", (userId) => {
      if (users[userId] && users[userId] !== socket.id) {
        io.to(users[userId]).emit("forceDisconnect");
      }

      users[userId] = socket.id;
      console.log(`User with MongoDB ID ${userId} registered with socket ID: ${socket.id}`);
      console.log(users)
    });

    socket.on("forceDisconnect", () => {
      socket.disconnect();
    });

    // Handle typing event
    socket.on("typing", (data) => {
      socket.broadcast.emit("user-typing", data);
    });

    // Handle incoming chat messages
    socket.on("chatMessage", ({ senderId, receiverId, message }) => {
      console.log(`Message from ${senderId} to ${receiverId}: ${message}`);

      const receiverSocketId = users[receiverId];

      if (receiverSocketId) {
        // Emit the message only to the specific receiver
        io.to(receiverSocketId).emit("receiveMessage", { senderId, message });
        console.log(`Message sent to user ${receiverId}`);
      } else {
        console.log(`User ${receiverId} is not connected.`);
      }
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
      for (const userId in users) {
        if (users[userId] === socket.id) {
          delete users[userId];
          console.log(`User with MongoDB ID ${userId} disconnected and removed from active users.`);
          break;
        }
      }
    });
  });
};
