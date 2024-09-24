import express from 'express';
import { enrolledCourseList } from '../controllers/EnrolledCourseController.js';
const router = express.Router();
router.get("/list", enrolledCourseList)
export default router