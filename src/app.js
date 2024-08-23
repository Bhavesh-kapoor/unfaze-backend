import express from "express";
import dotenv from "dotenv";
import authroutes from "./routes/admin/auth.route.js";
import cors from "cors";
import therapistRoutes from "./routes/therapist/therapist.route.js";
// import passport from "passport";
import passport from "./config/passportTherapist.js";
import session from "express-session";
import authTherapist from "./routes/auth/authTherapist.js";
import authUser from "./routes/auth/authUser.js";
import userRoutes from "./routes/user/userRoutes.js";
import emailRoutes from "./routes/emailOtpRoute.js"
import blogsrouter from "./routes/admin/blogs.route.js";
import contactusRoutes from "./routes/contactUs.router.js"
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

// social auth routes
app.use("/auth", authTherapist);
app.use("/auth", authUser);

// ###### ADMIN ROUTES  #####################

// routes for admin
app.use("/api/v1/admin", authroutes);
app.use("/api/v1/therapist", therapistRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/email",emailRoutes);
app.use("/api/v1/blogs",blogsrouter);
app.use("/api/v1/contact-us",contactusRoutes)

export default app;
