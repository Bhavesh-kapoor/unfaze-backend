import express from 'express';
import { findByTherapistId, createPay, payValidation, deletePay, updatePay, getAllMonetizations, getById } from '../../controllers/therapistPayController.js';
const router = express.Router();

router.post("/create", payValidation, createPay)
router.put("/update/:_id", updatePay)
router.delete("/delete/:_id", deletePay)
router.get("/find-by-therapist-id/:therapistId", findByTherapistId)
router.get("/get-all", getAllMonetizations)
router.get("/get-by-id/:_id", getById)

export default router;