import fs from "fs";
import path from "path";
import cors from "cors";
import chalk from "chalk";
import helmet from "helmet";
import dotenv from "dotenv";
import express from "express";
import winston from "winston";
import { fileURLToPath } from "url";
import session from "express-session";
import routes from "./routes/index.js";
import rateLimit from "express-rate-limit";
import passport from "./config/passportUser.js";
import crypto from 'crypto';

// Load environment variables
dotenv.config();

// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

// Initialize the app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 250, // Limit each IP to 100 requests per `window` (15 minutes)
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Mitigate XSS
      secure: process.env.NODE_ENV === "production", // Set to true in production
      maxAge: 60 * 60 * 1000, // 1 hour
    },
  })
);

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());
// Middleware to log request details
app.use((req, res, next) => {
  const startTime = process.hrtime();
  res.on("finish", () => {
    // Calculate response time
    const diff = process.hrtime(startTime);
    const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2); // In milliseconds

    // Status code color logic
    const statusColor =
      res.statusCode >= 500
        ? chalk.red
        : res.statusCode >= 400
          ? chalk.yellow
          : res.statusCode >= 300
            ? chalk.cyan
            : res.statusCode >= 200
              ? chalk.green
              : chalk.white;

    // Logging the request
    logger.info(
      `${chalk.blue("METHOD:")} ${chalk.yellow(req.method)} - ${chalk.blue(
        "URL:"
      )} ${chalk.yellow(req.originalUrl)} - ${chalk.blue(
        "STATUS:"
      )} ${statusColor(res.statusCode)} - ${chalk.blue(
        "Response Time:"
      )} ${chalk.magenta(`${responseTime} ms`)}`
    );
  });

  next();
});

// Dynamic image serving endpoint
app.get("/images/uploads/:folder/:image", (req, res) => {
  const { folder, image } = req.params;
  const imagePath = path.join(__dirname, "images/uploads", folder, image);
  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) return res.status(404).json({ message: "Image not found" });
    res.sendFile(imagePath);
  });
});

// Use grouped routes
app.use("/api", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ message: "An unexpected error occurred." });
});

export default app;
