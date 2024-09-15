import { Router } from "express";
import {
  TotalSalesList,
  ListByCategory,
  calculateTotalSales,
  TotalSalesByDuration,
  fetchAllTransactions,
} from "../../controllers/admin/transactionsController.js";

const router = Router();

router.get("/total-sales", calculateTotalSales);

router.get("/list", fetchAllTransactions);

router.get("/total-sales-list", TotalSalesList);

router.get("/list-by-category", ListByCategory);

router.get("/total-sales-duration", TotalSalesByDuration);

export default router;
