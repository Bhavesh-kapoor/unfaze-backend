import { Router } from "express";
import {
  TotalSalesList,
  ListByCategory,
  calculateTotalSales,
  TotalSalesByDuration,
  fetchAllTransactions,
} from "../../controllers/admin/transactionsController.js";
import { manualPaymentValidator } from "../../controllers/paymentHandler.js";
import { validatePayment } from "../../middleware/admin/phonePayConfig.js";

const router = Router();

router.get("/total-sales", calculateTotalSales);

router.get("/list", fetchAllTransactions);

router.get("/total-sales-list", TotalSalesList);

router.get("/list-by-category", ListByCategory);

router.get("/total-sales-duration", TotalSalesByDuration);
router.get("/transaction-validator/:merchantTransactionId", validatePayment, manualPaymentValidator);

export default router;
