import express from 'express';
import { initiateRefund, getRefundList, acceptRefund } from '../controllers/refundController.js';

const router = express.Router()

router.post('/initiate', initiateRefund);
router.get('/get-list', getRefundList);
router.patch('/accept-refund/:refundId', acceptRefund);

export default router;