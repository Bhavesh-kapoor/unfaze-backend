import { Router } from "express";
import {
  TotalSalesList,
  ListByCategory,
  calculateTotalSales,
  TotalSalesByDuration,
} from "../../controllers/admin/transactionsController.js";

const router = Router();

router.get("/total-sales", calculateTotalSales);

router.get("/total-sales-list", TotalSalesList);

router.get("/list-by-category", ListByCategory);

router.get("/total-sales-duration", TotalSalesByDuration);

export default router;
