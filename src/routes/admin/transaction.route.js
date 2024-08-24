import { Router } from "express";
import { calculateTotalSales } from "../../controllers/admin/transactionsController.js";
import isAdmin from "../../middleware/admin/isAdmin.js";

const router = Router()

router.get("/total-sales",isAdmin,calculateTotalSales)
export default router;