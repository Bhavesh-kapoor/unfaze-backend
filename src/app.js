// import passport from "passport";

import cors from "cors";
import chalk from "chalk";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import passport from "./config/passportTherapist.js";
import authroutes from "./routes/admin/auth.route.js";
import authUser from "./routes/auth/authUser.js";
import emailRoutes from "./routes/emailOtpRoute.js";
import userRoutes from "./routes/user/userRoutes.js";
import blogsrouter from "./routes/admin/blogs.route.js";
import contactusRoutes from "./routes/contactUs.router.js";
import authTherapist from "./routes/auth/authTherapist.js";
import therapistRoutes from "./routes/therapist/therapist.route.js";
import specializationRoute from "./routes/admin/specilization.route.js";

dotenv.config();
const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// sesssion
app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Middleware to log request details
app.use((req, res, next) => {
  const startTime = process.hrtime();

  res.on("finish", () => {
    // Calculate response time
    const diff = process.hrtime(startTime);
    const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2); // In milliseconds
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
    console.log(
      `${chalk.gray("[INFO]")} ${chalk.gray(formattedDate)} - ${chalk.blue(
        "Method:"
      )} ${chalk.yellow(req.method)}, ${chalk.blue("URL:")} ${chalk.yellow(
        req.originalUrl
      )}, ${chalk.blue("Status:")} ${statusColor(res.statusCode)}, ${chalk.blue(
        "Response Time:"
      )} ${chalk.magenta(`${responseTime} ms`)}`
    );
  });

  next();
});

// social auth routes
app.use("/auth", authTherapist);
app.use("/auth", authUser);

// ###### ADMIN ROUTES  #####################

// routes for admin
app.use("/api/v1/admin", authroutes);
app.use("/api/v1/therapist", therapistRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/email", emailRoutes);
app.use("/api/v1/blogs", blogsrouter);
app.use("/api/v1/contact-us", contactusRoutes);
app.use("/api/v1/specialization", specializationRoute);

export default app;
