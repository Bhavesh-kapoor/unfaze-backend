import express from "express";
import {
  getOverview,
  getOverviewByRevenue,
} from "../../controllers/admin/dashboardController.js";

const router = express.Router();

router.get("/overview", getOverview);

router.get("/overview-revenue", getOverviewByRevenue);

export default router;
