import express from 'express';
import connectDB from '../db/connection.js';
import dotenv from 'dotenv';
import router from './routes/admin/auth.js';
dotenv.config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:false}));






// routes for admin

app.use('/api/v1/admin',router);





export default app;

