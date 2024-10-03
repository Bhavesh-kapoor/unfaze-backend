import Router from 'express';
import { store, list, edit, update, deleteCoupon, coupenValidation } from '../../controllers/admin/coupenController.js';

const coupenRoute = Router();

// Store a new coupon
coupenRoute.post('/store', coupenValidation, store);

// List all coupons (with Specialization name)
coupenRoute.get('/list', list);

// Get details of a single coupon by ID (with Specialization name)
coupenRoute.get('/edit/:id', edit);

// Update a coupon by ID
coupenRoute.put('/update/:id', coupenValidation, update);

// Delete a coupon by ID
coupenRoute.delete('/delete/:id', deleteCoupon);

export default coupenRoute;
