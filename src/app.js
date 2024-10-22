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
import "./jobs/transactionJobs.js";
import "./jobs/sessionJobs.js";
import "./jobs/reminderMailJob.js";
// import "./jobs/sessionReminderForUser.js";
// import "./jobs/missedSessionReminder.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS;
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Add any HTTP methods you need
  credentials: true, // Enable this if you need to pass cookies or authorization headers
};

app.use(helmet());
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 30 * 1000,
  max: 1000,
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  const startTime = process.hrtime();
  res.on("finish", () => {
    const diff = process.hrtime(startTime);
    const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

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
app.get("/images/:folder/:image", (req, res) => {
  const { folder, image } = req.params;
  const imagePath = path.join(__dirname, "images", folder, image);
  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) return res.status(404).json({ message: "Image not found" });
    res.sendFile(imagePath);
  });
});

app.get("/images/therapists/:subfolder/:image", (req, res) => {
  const { subfolder, image } = req.params;
  const imagePath = path.join(__dirname, "images/therapists", subfolder, image);
  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) return res.status(404).json({ message: "Image not found" });
    res.sendFile(imagePath);
  });
});

app.use("/api", routes);
// import { updateUserPasswords } from "./config/scripts/user.js";
// updateUserPasswords("unfazed123")

app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ message: "An unexpected error occurred." });
});
export default app;
