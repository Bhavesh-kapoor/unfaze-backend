import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { EnrolledCourse } from "../../models/enrolledCourse.model.js";

import {
    startOfDay, endOfDay,
    startOfWeek, endOfWeek,
    startOfMonth, endOfMonth,
    startOfYear, endOfYear
} from 'date-fns';
const calculateTotalSales = async (req, res) => {
    try {
      const { duration, page = 1, limit = 10 } = req.query;
      let startDate, endDate;
  
      const now = new Date();
  
      switch (duration) {
        case 'today':
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
  
        case 'week':
          startDate = startOfWeek(now, { weekStartsOn: 1 }); // Week starts on Monday (adjust if needed)
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
  
        case 'month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
  
        case 'year':
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
  
        case 'all time':
          startDate = new Date(0); // Epoch time (beginning of Unix time)
          endDate = new Date(); // Current time
          break;
  
        default:
          return res.status(400).json({ error: 'Invalid duration flag' });
      }
  
      // Convert startDate and endDate to UTC
      const totalSales = await EnrolledCourse.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate.toISOString(),
              $lte: endDate.toISOString(),
            },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]);
  
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);
  
      const paginatedSales = await EnrolledCourse.find({
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .sort({ createdAt: -1 });
  
      const totalRecords = totalSales[0]?.count || 0;
      const totalPages = Math.ceil(totalRecords / limitNumber);
      const result = totalSales[0]?.totalSales || 0;
  
      return res.status(200).json({
        totalSales: result,
        totalItems:totalRecords,
        totalPages,
        currentPage: pageNumber,
        records: paginatedSales,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  

export { calculateTotalSales }