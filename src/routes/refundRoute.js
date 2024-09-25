import express from 'express';
import { initiateRefund, getRefundList } from '../controllers/refundController.js';

const router = express.Router()

router.post('/initiate', initiateRefund);
router.get('/get-list', getRefundList);

export default router;