import express from "express";
import connectDB from "../db/connection.js";
import dotenv from "dotenv";
import authroutes from "./routes/admin/auth.route.js";
import cors from "cors";
import therapistRoutes from "./routes/therapist/therapist.route.js";

dotenv.config();
const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ###### ADMIN ROUTES  #####################

// routes for admin
app.use("/api/v1/admin", authroutes);
app.use("/api/v1/therepist", therapistRoutes);

export default app;
