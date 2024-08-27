import { Router } from "express";
import { calculateTotalSales,TotalSalesList } from "../../controllers/admin/transactionsController.js";
import isAdmin from "../../middleware/admin/isAdmin.js";

const router = Router()

router.get("/total-sales",isAdmin,calculateTotalSales)
router.get("/total-sales-list",isAdmin,TotalSalesList)
export default router;