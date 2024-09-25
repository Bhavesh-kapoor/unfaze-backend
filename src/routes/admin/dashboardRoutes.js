import express from "express";
import {
  getOverview,
  getOverviewByRevenue,
  getOverviewBySessions,
} from "../../controllers/admin/dashboardController.js";

const router = express.Router();

router.get("/overview", getOverview);

router.get("/overview-revenue", getOverviewByRevenue);

router.get("/overview-sessions", getOverviewBySessions);

export default router;
