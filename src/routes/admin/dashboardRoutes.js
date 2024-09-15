import express from "express";
import { getOverview } from "../../controllers/admin/dashboardController.js";

const router = express.Router();

router.get("/overview", getOverview);

export default router;
