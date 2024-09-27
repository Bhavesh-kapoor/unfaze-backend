// socketConfig.js
import { Server } from "socket.io";

export const configureSocket = (httpServer, app) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Adjust for your client URL
      methods: ["GET", "POST"],
    },
  });

  // Attach the io instance to the Express app
  app.set("socketio", io);

  io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);

    socket.on("chatMessage", ({ senderId, receiverId, message }) => {
      console.log(`Message from ${senderId} to ${receiverId}: ${message}`);
      // Emit message to the specific receiver
      io.to(receiverId).emit("receiveMessage", { senderId, message });
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};
