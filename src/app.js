import express from "express";
import dotenv from "dotenv";
import authroutes from "./routes/admin/auth.route.js";
import cors from "cors";
import therapistRoutes from "./routes/therapist/therapist.route.js";
// import passport from "passport";
import passport from "./config/passport.js";
import session from "express-session";
import auth from "./routes/auth.js";

dotenv.config();
const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// sesssion
app.use(
  session({
    secret: "secretkey123455",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// social auth routes
app.use("/auth", auth);


// ###### ADMIN ROUTES  #####################

// routes for admin
app.use("/api/v1/admin", authroutes);
app.use("/api/v1/therepist", therapistRoutes);

export default app;
