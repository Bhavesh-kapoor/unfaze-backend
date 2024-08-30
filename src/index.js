import app from "./app.js";
import winston from "winston";
import { config } from "dotenv";
import connectDB from "../db/connection.js";

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
if (!process.env.PORT || !process.env.DB_URL || !process.env.DB_NAME) {
  logger.error(
    "Missing required environment variables (PORT, DB_URL, DB_NAME). Exiting..."
  );
  process.exit(1);
}

// Connect to the database and start the server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(process.env.PORT, () => {
      logger.info(`Server is running at http://localhost:${process.env.PORT}`);
    });
  } catch (err) {
    logger.error(`Failed to start the server: ${err.message}`);
    process.exit(1); // Exit the process with failure
  }
};

// Start the server
startServer();
