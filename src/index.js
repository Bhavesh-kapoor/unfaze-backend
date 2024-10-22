import app from "./app.js";
import winston from "winston";
import { config } from "dotenv";
import connectDB from "../db/connection.js";
import { createServer } from "http"; // Create HTTP server
import { configureSocket } from "./schocket.io/schocket.io.js";

// Load environment variables
config();

// Set up Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

// Validate necessary environment variables
if (!process.env.PORT || !process.env.DB_URL) {
  logger.error("Missing required environment variables. Exiting...");
  process.exit(1);
}

// Create HTTP server from Express app
const httpServer = createServer(app);

// Initialize Socket.IO with the HTTP server
configureSocket(httpServer, app);

// Graceful shutdown
const shutdown = () => {
  logger.info("Shutting down the server...");
  httpServer.close(() => {
    logger.info("Server closed.");
    process.exit(0);
  });

  // Force shutdown after 10 seconds if it doesn't shut down properly
  setTimeout(() => {
    logger.error("Forcing shutdown after timeout.");
    process.exit(1);
  }, 10000).unref(); // Prevent blocking the event loop
};

// Handle unexpected errors
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1); // Exit the process to avoid inconsistent state
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Promise Rejection: ${reason}`);
  process.exit(1); // Exit the process to avoid inconsistent state
});

// Gracefully handle SIGTERM and SIGINT signals
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Connect to the database and start the server
const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(process.env.PORT, () => {
      logger.info(`Server is running at http://localhost:${process.env.PORT}`);
    });
  } catch (err) {
    logger.error(`Failed to start the server: ${err.message}`);
    process.exit(1);
  }
};

startServer();
