import express from 'express';
import connectDB from '../db/connection.js';
import dotenv from 'dotenv';
import authroutes from './routes/admin/auth.route.js';

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:false}));




// ###### ADMIN ROUTES  #####################

// routes for admin
app.use('/api/v1/admin',authroutes);






export default app;

