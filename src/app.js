import cors from "cors";
import chalk from "chalk";
import helmet from "helmet";
import dotenv from "dotenv";
import express from "express";
import winston from "winston";
import session from "express-session";
import rateLimit from "express-rate-limit";
import passport from "./config/passportTherapist.js";
import routes from "./routes/index.js"; // Grouped routes
import authUser from "./routes/auth/authUser.js";
import authTherapist from "./routes/auth/authTherapist.js";

// Load environment variables
dotenv.config();

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

    const formattedDate = new Date().toISOString();

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

// Social auth routes
app.use("/auth", authUser);
// app.use("/auth", authTherapist);

// Use grouped routes
app.use("/api/v1", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ message: "An unexpected error occurred." });
});

export default app;
