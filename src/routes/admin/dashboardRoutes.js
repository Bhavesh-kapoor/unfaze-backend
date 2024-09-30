import express from "express";
import {
  getOverview,
  getOverviewByRevenue,
  getOverviewBySessions,
  getTransactionsAndSessiosByMonth
} from "../../controllers/admin/dashboardController.js";

const router = express.Router();

router.get("/overview", getOverview);

router.get("/overview-revenue", getOverviewByRevenue);

router.get("/overview-sessions", getOverviewBySessions);
router.get("/", getOverviewBySessions);
router.get("/line-chart", getTransactionsAndSessiosByMonth);

export default router;
