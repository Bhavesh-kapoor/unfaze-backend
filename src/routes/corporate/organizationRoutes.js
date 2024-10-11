import express from 'express';
import { register, update, getById, deleteById, getAll } from '../../controllers/corporate/organizationController.js';

const router = express.Router();

router.post('/register', register);

router.put('/update/:id', update);

router.get('/get/:id', getById);

router.get('/all', getAll);

router.delete('/delete/:id', deleteById);

export default router;
