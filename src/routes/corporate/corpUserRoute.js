import express from 'express';
import { bookSessionFromCorpPackage } from '../../controllers/admin/sessionsControllers.js';
import { getAllottedSession } from '../../controllers/corporate/packageDistributionController.js';
const router = express.Router();

router.post('/book-session-cp', bookSessionFromCorpPackage);
router.get('/get-allotted-sessions', getAllottedSession);

export default router;