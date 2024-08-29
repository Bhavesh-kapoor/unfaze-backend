import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { EnrolledCourse } from "../../models/enrolledCourse.model.js";
import { Therapist } from "../../models/therapistModel.js";
import { User } from "../../models/userModel.js";

import { startOfDay, endOfDay, subDays, subMonths, subYears } from "date-fns";

const calculateTotalSales = asyncHandler(async (req, res) => {
  const { duration = "week" } = req.query;
  let startDate, endDate;
  const now = new Date();
  switch (duration) {
    case "today":
      startDate = startOfDay(now);
      endDate = endOfDay(now);
      break;

    case "week":
      startDate = subDays(now, 7);
      endDate = endOfDay(now);
      break;
    case "month":
      startDate = subMonths(now, 1);
      endDate = endOfDay(now);
      break;
    case "year":
      startDate = subYears(now, 1);
      endDate = endOfDay(now);
      break;
    case "all time":
      startDate = new Date(0);
      endDate = endOfDay(now);
      break;

    default:
      return res.status(400).json({ error: "Invalid duration flag" });
  }
  const totalSales = await EnrolledCourse.aggregate([
    {
      $match: {
        $and: [
          { createdAt: { $gte: startDate } },
          { createdAt: { $lte: endDate } },
        ],
      },
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);
  if (!totalSales) {
    return res.status(404).json(new ApiError(404, error, "No.records found!"));
  }
  const totalRecords = totalSales[0]?.count || 0;
  const totalAmount = totalSales[0]?.totalSales || 0;
  const totalActiveTherapist = await Therapist.countDocuments({
    is_active: true,
  });
  const totalActiveUser = await User.countDocuments({
    // is_active: true,
    role: "user",
  });

  // Ammount in rupees----------------------------------------
  return res
    .status(200)
    .json(
      new ApiResponse(200, {
        totalSales: totalAmount / 100,
        totalCounts: totalRecords,
        totalActiveTherapist,
        totalActiveUser,
      })
    );
});
const TotalSalesList = asyncHandler(async (req, res) => {
  try {
    const {
      startDate = subDays(new Date(), 7),
      endDate = endOfDay(new Date()),
      page = 1,
      limit = 10,
      sortkey = "createdAt",
      sortdir = "desc",
    } = req.query;

    // Convert startDate and endDate to Date objects if they are strings
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res
        .status(400)
        .json(new ApiError(400, "", "Invalid date format!"));
    }
    if (start > end) {
      return res
        .status(400)
        .json(
          new ApiError(
            400,
            "",
            "Start date should not be greater than end date!"
          )
        );
    }
    const totalSales = await EnrolledCourse.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("totalSales", totalSales);
    if (totalSales.length === 0) {
      return res.status(404).json(new ApiError(404, "", "No.records found!"));
    }
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    const paginatedSales = await EnrolledCourse.find({
      createdAt: {
        $gte: start,
        $lte: end,
      },
    })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .sort({ [sortkey]: sortdir === "desc" ? -1 : 1 });

    const totalRecords = totalSales[0]?.count || 0;
    const totalAmount = totalSales[0]?.totalSales || 0;

    const pagination = {
      currentPage: pageNumber,
      totalPages: Math.ceil(totalRecords / limitNumber),
      totalItems: totalRecords,
      itemsPerPage: limitNumber,
    };

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          startDate,
          endDate,
          pagination,
          totalAmount,
          result: paginatedSales,
        },
        "Transaction fetched successfully!"
      )
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
const ListByCategory=asyncHandler(async(req,res)=>{

})

export { calculateTotalSales, TotalSalesList,ListByCategory };
