import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { Session } from "../../models/sessionsModel.js";
import { Therapist } from "../../models/therapistModel.js";
import { Transaction } from "../../models/transactionModel.js";
import { User } from "../../models/userModel.js";
import mongoose from "mongoose";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  addDays,
  addHours,
} from "date-fns";

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
    isActive: true,
  });
  const totalActiveUser = await User.countDocuments({
    // isActive: true,
    role: "user",
  });

  // Ammount in rupees----------------------------------------
  return res.status(200).json(
    new ApiResponse(200, {
      totalSales: totalAmount / 100,
      totalCounts: totalRecords,
      totalActiveTherapist,
      totalActiveUser,
    })
  );
});

export const fetchAllTransactions = async (req, res) => {
  try {
    const { status = "successful", page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const pipeline = [
      { $match: { payment_status: status } },
      {
        $lookup: {
          from: "specializations",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userData",
        },
      },
      { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "therapists",
          localField: "therapist_id",
          foreignField: "_id",
          as: "therapistData",
        },
      },
      { $unwind: { path: "$therapistData", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          end_time: 1,
          rate_USD: 1,
          updatedAt: 1,
          createdAt: 1,
          amount_USD: 1,
          amount_INR: 1,
          start_time: 1,
          transactionId: 1,
          payment_status: 1,
          payment_details: 1,
          method: 1,
          "category.name": 1,
          "userData.email": 1,
          "userData.lastName": 1,
          "userData.firstName": 1,
          "therapistData.email": 1,
          "therapistData.lastName": 1,
          "therapistData.firstName": 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: (pageNumber - 1) * pageSize },
      { $limit: pageSize },

    ];
    const transactions = await Transaction.aggregate(pipeline).exec();

    const totalCount = await Transaction.countDocuments({
      payment_status: status,
    }).exec();

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalCount / pageSize),
        totalItems: totalCount,
        itemsPerPage: pageSize,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Unable to fetch transactions.",
    });
  }
};

const TotalSalesByDuration = asyncHandler(async (req, res) => {
  const now = new Date();

  // Defined the date ranges for different periods using a date library like date-fns
  const getDateRanges = (now) => ({
    today: { start: startOfDay(now), end: endOfDay(now) },
    yesterday: {
      start: startOfDay(subDays(now, 1)),
      end: endOfDay(subDays(now, 1)),
    },
    thisWeek: { start: startOfWeek(now), end: endOfWeek(now) },
    lastWeek: {
      start: startOfWeek(subWeeks(now, 1)),
      end: endOfWeek(subWeeks(now, 1)),
    },
    thisMonth: { start: startOfMonth(now), end: endOfMonth(now) },
    lastMonth: {
      start: startOfMonth(subMonths(now, 1)),
      end: endOfMonth(subMonths(now, 1)),
    },
    thisYear: {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear(), 11, 31),
    },
    lastYear: {
      start: new Date(now.getFullYear() - 1, 0, 1),
      end: new Date(now.getFullYear() - 1, 11, 31),
    },
  });

  const dateRanges = getDateRanges(now);

  const getTotalSales = async (startDate, endDate) => {
    const result = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          payment_status: "successful",  // Ensure that only successful transactions are counted
        },
      },
      {
        $group: {
          _id: null,
          totalUSDSales: { $sum: "$amount_USD" }, // Replace transaction_details fields with direct fields
          totalINRSales: { $sum: "$amount_INR" },
          countUSDSales: {
            $sum: {
              $cond: [{ $gt: ["$amount_USD", 0] }, 1, 0],  // Count non-zero USD transactions
            },
          },
          countINRSales: {
            $sum: {
              $cond: [{ $gt: ["$amount_INR", 0] }, 1, 0],  // Count non-zero INR transactions
            },
          },
        },
      },
    ]);

    return (
      result[0] || {
        totalUSDSales: 0,
        totalINRSales: 0,
        countUSDSales: 0,
        countINRSales: 0,
      }
    );
  };


  // Function to get the count of newly created users within a time range
  const getNewUserCount = async (startDate, endDate) => {
    return await User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      role: "user",
    });
  };
  // Days and hours passed calculations
  const daysPassedInCurrentWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
  const daysPassedInCurrentMonth = now.getDate(); // Day of the month (1-31)
  const daysPassedInCurrentYear = Math.floor(
    (now - new Date(now.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24)
  );
  const hoursPassedToday = now.getHours();

  // Comparison date ranges
  const comparativeWeekStart = startOfWeek(subWeeks(now, 1));
  const comparativeWeekEnd = addDays(
    comparativeWeekStart,
    daysPassedInCurrentWeek
  );

  const comparativeMonthStart = startOfMonth(subMonths(now, 1));
  const comparativeMonthEnd = addDays(
    comparativeMonthStart,
    daysPassedInCurrentMonth - 1
  );

  const comparativeYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const comparativeYearEnd = addDays(
    comparativeYearStart,
    daysPassedInCurrentYear
  );

  const comparativeDayStart = startOfDay(subDays(now, 1));
  const comparativeDayEnd = addHours(comparativeDayStart, hoursPassedToday);

  const todayStart = startOfDay(now);
  const todayEnd = addHours(todayStart, hoursPassedToday);

  // Total sales of all time
  const getTotalSalesOfAllTime = async () => {
    const result = await Transaction.aggregate([
      // {
      //   $lookup: {
      //     from: "transactions",
      //     localField: "transaction_id",
      //     foreignField: "_id",
      //     as: "transaction_details",
      //   },
      // },
      // {
      //   $unwind: "$transaction_details",
      // },
      {
        $match: {
          payment_status: "successful",
        },
      },
      {
        $group: {
          _id: null,
          totalUSDSales: { $sum: "$amount_USD" },
          totalINRSales: { $sum: "$amount_INR" },
          countUSDSales: {
            $sum: {
              $cond: [{ $gt: ["$amount_USD", 0] }, 1, 0],
            },
          },
          countINRSales: {
            $sum: {
              $cond: [{ $gt: ["$amount_INR", 0] }, 1, 0],
            },
          },
        },
      },
    ]);

    return (
      result[0] || {
        totalUSDSales: 0,
        totalINRSales: 0,
        countUSDSales: 0,
        countINRSales: 0,
      }
    );
  };

  const [
    salesToday,
    salesYesterday,
    salesThisWeek,
    salesLastWeek,
    salesThisMonth,
    salesLastMonth,
    salesThisYear,
    salesLastYear,
    totalActiveTherapist,
    totalActiveUser,
    salesComparativeWeek,
    salesComparativeMonth,
    salesComparativeYear,
    salesComparativeDay,
    totalSalesOfAllTime,
    newUsersToday,
    newUsersYesterday,
    newUsersThisWeek,
    newUsersLastWeek,
    newUsersThisMonth,
    newUsersLastMonth,
    newUsersThisYear,
    newUsersLastYear,
  ] = await Promise.all([
    getTotalSales(dateRanges.today.start, dateRanges.today.end),
    getTotalSales(dateRanges.yesterday.start, dateRanges.yesterday.end),
    getTotalSales(dateRanges.thisWeek.start, dateRanges.thisWeek.end),
    getTotalSales(dateRanges.lastWeek.start, dateRanges.lastWeek.end),
    getTotalSales(dateRanges.thisMonth.start, dateRanges.thisMonth.end),
    getTotalSales(dateRanges.lastMonth.start, dateRanges.lastMonth.end),
    getTotalSales(dateRanges.thisYear.start, dateRanges.thisYear.end),
    getTotalSales(dateRanges.lastYear.start, dateRanges.lastYear.end),
    Therapist.countDocuments({ isActive: true }),
    User.countDocuments({ role: "user" }),
    getTotalSales(comparativeWeekStart, comparativeWeekEnd),
    getTotalSales(comparativeMonthStart, comparativeMonthEnd),
    getTotalSales(comparativeYearStart, comparativeYearEnd),
    getTotalSales(comparativeDayStart, comparativeDayEnd),
    getTotalSalesOfAllTime(),
    getNewUserCount(dateRanges.today.start, dateRanges.today.end),
    getNewUserCount(dateRanges.yesterday.start, dateRanges.yesterday.end),
    getNewUserCount(dateRanges.thisWeek.start, dateRanges.thisWeek.end),
    getNewUserCount(dateRanges.lastWeek.start, dateRanges.lastWeek.end),
    getNewUserCount(dateRanges.thisMonth.start, dateRanges.thisMonth.end),
    getNewUserCount(dateRanges.lastMonth.start, dateRanges.lastMonth.end),
    getNewUserCount(dateRanges.thisYear.start, dateRanges.thisYear.end),
    getNewUserCount(dateRanges.lastYear.start, dateRanges.lastYear.end),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      days: {
        current: {
          INR: salesToday.totalINRSales,
          USD: salesToday.totalUSDSales,
          countsUSD: salesToday.countUSDSales,
          countsINR: salesToday.countINRSales,
          UserCount: newUsersToday,
        },
        last: {
          INR: salesYesterday.totalINRSales,
          USD: salesYesterday.totalUSDSales,
          comparativeUSD: salesComparativeDay.totalUSDSales,
          comparativeINR: salesComparativeDay.totalINRSales,
          countsCompUSD: salesComparativeDay.countUSDSales,
          countsCompINR: salesComparativeDay.countINRSales,
          countsUSD: salesYesterday.countUSDSales,
          countsINR: salesYesterday.countINRSales,
          UserCount: newUsersYesterday,
        },
      },
      weeks: {
        current: {
          INR: salesThisWeek.totalINRSales,
          USD: salesThisWeek.totalUSDSales,
          countsUSD: salesThisWeek.countUSDSales,
          countsINR: salesThisWeek.countINRSales,
          UserCount: newUsersThisWeek,
        },
        last: {
          INR: salesLastWeek.totalINRSales,
          USD: salesLastWeek.totalUSDSales,
          comparativeUSD: salesComparativeWeek.totalUSDSales,
          comparativeINR: salesComparativeWeek.totalINRSales,
          countsCompUSD: salesComparativeWeek.countUSDSales,
          countsCompINR: salesComparativeWeek.countINRSales,
          countsUSD: salesLastWeek.countUSDSales,
          countsINR: salesLastWeek.countINRSales,
          UserCount: newUsersLastWeek,
        },
      },
      months: {
        current: {
          INR: salesThisMonth.totalINRSales,
          USD: salesThisMonth.totalUSDSales,
          countsUSD: salesThisMonth.countUSDSales,
          countsINR: salesThisMonth.countINRSales,
          UserCount: newUsersThisMonth,
        },
        last: {
          INR: salesLastMonth.totalINRSales,
          USD: salesLastMonth.totalUSDSales,
          comparativeUSD: salesComparativeMonth.totalUSDSales,
          comparativeINR: salesComparativeMonth.totalINRSales,
          countsCompUSD: salesComparativeMonth.countUSDSales,
          countsCompINR: salesComparativeMonth.countINRSales,
          countsUSD: salesLastMonth.countUSDSales,
          countsINR: salesLastMonth.countINRSales,
          UserCount: newUsersLastMonth,
        },
      },
      years: {
        current: {
          INR: salesThisYear.totalINRSales,
          USD: salesThisYear.totalUSDSales,
          countsUSD: salesThisYear.countUSDSales,
          countsINR: salesThisYear.countINRSales,
          UserCount: newUsersThisYear,
        },
        last: {
          INR: salesLastYear.totalINRSales,
          USD: salesLastYear.totalUSDSales,
          comparativeUSD: salesComparativeYear.totalUSDSales,
          comparativeINR: salesComparativeYear.totalINRSales,
          countsCompUSD: salesComparativeYear.countUSDSales,
          countsCompINR: salesComparativeYear.countINRSales,
          countsUSD: salesLastYear.countUSDSales,
          countsINR: salesLastYear.countINRSales,
          UserCount: newUsersLastYear,
        },
      },
      allTime: {
        current: {
          INR: totalSalesOfAllTime.totalINRSales,
          USD: totalSalesOfAllTime.totalUSDSales,
          countsUSD: totalSalesOfAllTime.countUSDSales,
          countsINR: totalSalesOfAllTime.countINRSales,
          UserCount: totalActiveUser,
        },
        last: {
          INR: null,
          USD: null,
          comparativeUSD: null,
          comparativeINR: null,
          countsCompUSD: null,
          countsCompINR: null,
          countsUSD: null,
          countsINR: null,
          UserCount: null,
        },
      },
      totalActiveTherapist: totalActiveTherapist,
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

    // console.log("totalSales", totalSales);
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
const ListByCategory = asyncHandler(async (req, res) => {
  let pipeline = [
    {
      $lookup: {
        from: "courses",
        localField: "course_id",
        foreignField: "_id",
        as: "course",
      },
    },
    { $unwind: "$course" }, // Unwind to deconstruct the 'course' array
    {
      $lookup: {
        from: "specializations",
        localField: "course.specialization_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $project: {
        _id: 1,
        course: 1,
        category: 1,
        createdAt: 1,
      },
    },
    {
      $group: {
        _id: "$category.name",
        courses: {
          $push: {
            enrolledCourse: "$$ROOT", // Push the entire document into the array
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        category_name: "$_id",
        courses: {
          $slice: [
            {
              $sortArray: {
                input: "$courses",
                sortBy: { "enrolledCourse.createdAt": -1 },
              }, // Sort courses by 'createdAt' within each group
            },
            3, // Limit to top 3
          ],
        },
      },
    },
  ];

  const data = await EnrolledCourse.aggregate(pipeline);
  return res.status(200).json({ data });
});

// const getTherapistSessions = async (req, res) => {
//   try {
//     const user = req.user;
//     let therapistId;

//     if (user.role === "admin") {
//       therapistId = req.query.therapistId;
//     } else {
//       therapistId = user?._id;
//     }
//     const { status = "upcoming", page = 1, limit = 10 } = req.query;

//     if (!therapistId) {
//       return res
//         .status(400)
//         .json(new ApiError(400, null, "Therapist ID is required!"));
//     }
//     const pageNumber = parseInt(page, 10);
//     const limitNumber = parseInt(limit, 10);
//     const skip = (pageNumber - 1) * limitNumber;

//     const sessions = await Transaction.aggregate([
//       {
//         $match: {
//           therapist_id: therapistId,
//           "payment_details.payment_status": "successful"
//         },
//       },
//       {
//         $lookup: {
//           from: "therapists",
//           localField: "therapist_id",
//           foreignField: "_id",
//           pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
//           as: "therapist_details",
//         },
//       },
//       { $unwind: "$therapist_details" },
//       {
//         $lookup: {
//           from: "specializations",
//           localField: "category",
//           foreignField: "_id",
//           pipeline: [{ $project: { name: 1 } }],
//           as: "category",
//         },
//       },
//       { $unwind: "$category" },
//       {
//         $lookup: {
//           from: "users",
//           localField: "user_id",
//           foreignField: "_id",
//           pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
//           as: "user_details",
//         },
//       },
//       { $unwind: "$user_details" },
//       {
//         $project: {
//           transactionId: 1,
//           createdAt: 1,
//           userName: {
//             $concat: [
//               "$user_details.firstName",
//               " ",
//               "$user_details.lastName",
//             ],
//           },
//           therapistName: {
//             $concat: [
//               "$therapist_details.firstName",
//               " ",
//               "$therapist_details.lastName",
//             ],
//           },
//           category: "$category.name",
//           amount_USD: 1,
//           amount_INR: 1,
//           start_time:
//         },
//       },
//       { $skip: skip },
//       { $limit: limitNumber },
//     ]);

//     if (!sessions.length) {
//       return res
//         .status(404)
//         .json(new ApiResponse(200, [], "No transactions found for this user"));
//     }

//     if (!sessions.length) {
//       return res.status(404).json({ message: "No sessions found" });
//     }

//     res.status(200).json({
//       sessions,
//       page: pageNumber,
//       limit: limitNumber,
//       totalResults: sessions.length,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };
const getTherapistRevenue = async (req, res) => {
  try {
    const { therapistId } = req.params;
    const { duration } = req.query;
    let start, end;
    const now = new Date();
    switch (duration) {
      case "today":
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case "week":
        start = startOfWeek(new Date(), { weekStartsOn: 1 });
        end = endOfWeek(new Date(), { weekStartsOn: 1 });
        break;
      case "month":
        start = startOfMonth(new Date());
        end = endOfMonth(new Date());
        break;
      case "year":
        start = startOfYear(new Date());
        end = endOfYear(new Date());
        break;
      case "all":
        start = new Date(0);
        end = new Date();
        break;
      default:
        return res.status(400).json({ message: "Invalid duration parameter" });
    }

    // Function to calculate total revenue in a specific time range for both USD and INR
    const calculateRevenue = async (start, end) => {
      const result = await Session.aggregate([
        {
          $match: {
            therapistId: therapistId,
            createdAt: { $gte: start, $lte: end },
          },
        },
        {
          $lookup: {
            from: "transactions",
            localField: "transaction_id",
            foreignField: "_id",
            as: "transaction_details",
          },
        },
        {
          $unwind: "$transaction_details",
        },
        {
          $group: {
            _id: null,
            totalUSDSales: { $sum: "$transaction_details.amount_USD" },
            totalINRSales: { $sum: "$transaction_details.amount_INR" },
            countUSDSales: {
              $sum: {
                $cond: [{ $gt: ["$transaction_details.amount_USD", 0] }, 1, 0],
              },
            },
            countINRSales: {
              $sum: {
                $cond: [{ $gt: ["$transaction_details.amount_INR", 0] }, 1, 0],
              },
            },
          },
        },
      ]);
      return result.length > 0
        ? result[0]
        : {
          totalUSDSales: 0,
          totalINRSales: 0,
          countUSDSales: 0,
          countINRSales: 0,
        };
    };
    const revenue = await calculateRevenue(start, end);
    res
      .status(200)
      .json(ApiResponse(200, revenue, "revenue fetched successfully!"));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
const getTherapistSessions = async (req, res) => {
  try {
    const user = req.user;
    let userId;
    if (user.role === "admin") {
      userId = req.query.userId;
    } else {
      userId = user?._id;
    }
    const { status = "upcoming", page = 1, limit = 10 } = req.query;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiError(400, null, "Therapist ID is required!"));
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;
    const now = new Date();
    const matchConditions = {
      therapist_id: userId,
      status: status
    };

    if (status === "upcoming") {
      matchConditions.status = { $in: ["upcoming", "rescheduled"] };
    } else {
      matchConditions.status = status;
    }
    const sessions = await Session.aggregate([
      { $match: matchConditions },
      // {
      //   $lookup: {
      //     from: "transactions",
      //     localField: "transaction_id",
      //     foreignField: "_id",
      //     as: "transactions_details",
      //   },
      // },
      // { $unwind: "$transactions_details" },
      {
        $lookup: {
          from: "therapists",
          localField: "therapist_id",
          foreignField: "_id",
          pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
          as: "therapist_details",
        },
      },
      { $unwind: "$therapist_details" },
      {
        $lookup: {
          from: "specializations",
          localField: "category",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1 } }],
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
          as: "user_details",
        },
      },
      { $unwind: "$user_details" },
      {
        $project: {
          transactionId: 1,
          createdAt: 1,
          userName: {
            $concat: ["$user_details.firstName", " ", "$user_details.lastName"],
          },
          therapistName: {
            $concat: [
              "$therapist_details.firstName",
              " ",
              "$therapist_details.lastName",
            ],
          },
          therapistId: "$therapist_details._id",
          category: "$category.name",
          // amount_USD: "$transactions_details.amount_USD",
          // amount_INR: "$transactions_details.amount_INR",
          start_time: 1,
          status: 1,
        },
      },
      { $sort: { start_time: 1 } },
      { $skip: skip },
      { $limit: limitNumber },
    ]);

    if (!sessions.length) {
      return res.status(404).json({ message: "No sessions found" });
    }
    res.status(200).json({
      sessions,
      page: pageNumber,
      limit: limitNumber,
      totalResults: sessions.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
const getUserSessions = async (req, res) => {
  try {
    const user = req.user;
    let userId;
    if (user.role === "admin") {
      userId = req.query.userId;
    } else {
      userId = user?._id;
    }
    const { status = "upcoming", page = 1, limit = 10 } = req.query;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiError(400, null, "User ID is required!"));
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;
    const now = new Date();
    const matchConditions = {
      user_id: new mongoose.Types.ObjectId(userId),
      status: status,
    };
    if (status === "upcoming") {
      matchConditions.status = { $in: ["upcoming", "rescheduled"] };
    } else {
      matchConditions.status = status;
    }

    // if (status === "upcoming") {
    //   matchConditions.start_time = { $gt: now };
    // }
    const sessions = await Session.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "therapists",
          localField: "therapist_id",
          foreignField: "_id",
          pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
          as: "therapist_details",
        },
      },
      { $unwind: "$therapist_details" },
      {
        $lookup: {
          from: "specializations",
          localField: "category",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1 } }],
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
          as: "user_details",
        },
      },
      { $unwind: "$user_details" },
      {
        $project: {
          transactionId: 1,
          createdAt: 1,
          userName: {
            $concat: ["$user_details.firstName", " ", "$user_details.lastName"],
          },
          therapistName: {
            $concat: [
              "$therapist_details.firstName",
              " ",
              "$therapist_details.lastName",
            ],
          },
          therapistId: "$therapist_details._id",
          category: "$category.name",
          start_time: 1,
          status: 1,
          manuallyBooked: 1,
        },
      },
      { $sort: { start_time: 1 } },
      { $skip: skip },
      { $limit: limitNumber },
    ]);

    if (!sessions.length) {
      return res.status(404).json({ message: "No sessions found" });
    }
    res.status(200).json({
      sessions,
      page: pageNumber,
      limit: limitNumber,
      totalResults: sessions.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const UserTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const user = req.user;
  if (!user) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "User ID is required!"));
  }

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const skip = (pageNumber - 1) * limitNumber;

  const userTransactions = await Transaction.aggregate([
    {
      $match: {
        user_id: user._id,
        payment_status: "successful",
      },
    },
    {
      $lookup: {
        from: "therapists",
        localField: "therapist_id",
        foreignField: "_id",
        pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
        as: "therapist_details",
      },
    },
    { $unwind: "$therapist_details" },
    {
      $lookup: {
        from: "specializations",
        localField: "category",
        foreignField: "_id",
        pipeline: [{ $project: { name: 1 } }],
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $project: {
        transactionId: 1,
        createdAt: 1,
        therapistName: {
          $concat: [
            "$therapist_details.firstName",
            " ",
            "$therapist_details.lastName",
          ],
        },
        category: "$category.name",
        amount_USD: 1,
        amount_INR: 1,
        start_time: {
          $cond: {
            if: { $eq: ["$type", "course"] },
            then: "",
            else: "$start_time",
          },
        },
        payment_status: "$payment_details.payment_status",
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limitNumber },
  ]);

  if (!userTransactions.length) {
    return res
      .status(404)
      .json(new ApiResponse(200, [], "No transactions found for this user"));
  }

  return res.json(
    new ApiResponse(
      200,
      userTransactions,
      "Transactions retrieved successfully."
    )
  );
});

const therapistTransactions = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "User ID is required!"));
  }

  const transactions = await Transaction.aggregate([
    {
      $match: {
        therapist_id: user._id,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }],
        as: "user_details",
      },
    },
    { $unwind: "$user_details" },
    {
      $lookup: {
        from: "specializations",
        localField: "category",
        foreignField: "_id",
        pipeline: [{ $project: { name: 1 } }],
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $project: {
        transactionId: 1,
        createdAt: 1,
        userName: {
          $concat: ["$user_details.firstName", " ", "$user_details.lastName"],
        },
        userEmail: "$user_details.email",
        category: "$category.name",
        amount_USD: 1,
        amount_INR: 1,
        payment_status: "$payment_details.payment_status",
      },
    },
  ]);
  if (!transactions.length) {
    return res
      .status(404)
      .json(new ApiResponse(200, [], "No transactions found for this user"));
  }
  return res.json(
    new ApiResponse(200, transactions, "Transactions retrieved successfully.")
  );
});

const thankyou = asyncHandler(async (req, res) => {
  const { transactionId } = req.query;
  const data = await Transaction.findOne({ transactionId: transactionId });
  const transaction = await Transaction.aggregate([
    {
      $match: {
        transactionId: transactionId,
        payment_status: "successful",
      },
    },
    {
      $lookup: {
        from: "therapists",
        localField: "therapist_id",
        foreignField: "_id",
        pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
        as: "therapist_details",
      },
    },
    { $unwind: "$therapist_details" },
    {
      $lookup: {
        from: "specializations",
        localField: "category",
        foreignField: "_id",
        pipeline: [{ $project: { name: 1 } }],
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $project: {
        transactionId: 1,
        createdAt: 1,
        therapistName: {
          $concat: [
            "$therapist_details.firstName",
            " ",
            "$therapist_details.lastName",
          ],
        },
        category: "$category.name",
        start_time: 1,
        payment_status: "$payment_details.payment_status",
      },
    },
  ]);
  if (!transaction.length) {
    return res
      .status(404)
      .json(new ApiResponse(404, [], "No transactions found for this user"));
  }
  return res.json(
    new ApiResponse(200, transaction, "Transactions retrieved successfully.")
  );
});
const initiateRefund = asyncHandler(async (req, res) => {
  const { transactionId } = req.query;
  const transaction = await Transaction.findOneAndUpdate(
    { transactionId: transactionId },
    { payment_status: "REFUND_INITIATED" },
    { new: true }
  );
  if (!transaction) {
    return res
      .status(404)
      .json(new ApiResponse(404, [], "No transactions found for this user"));
  }
  return res.json(
    new ApiResponse(200, transaction, "Refund initiated successfully.")
  );
})

// const geTherapistsforChat = asyncHandler(async (req, res) => {
//   try {
//     const userId = req.user._id;

//     const therapists = await Transaction.aggregate([
//       {
//         $match: {
//           user_id: userId,
//           payment_status: 'successful'
//         }
//       },
//       {
//         $group: {
//           _id: "$therapist_id",
//           lastTransaction: { $max: "$createdAt" }
//         }
//       },
//       {
//         $lookup: {
//           from: 'therapists',
//           localField: '_id',
//           foreignField: '_id',
//           as: 'therapistDetails'
//         }
//       },
//       {
//         $unwind: "$therapistDetails"
//       },
//       {
//         $project: {
//           _id: '$therapistDetails._id',
//           email: '$therapistDetails.email',
//           fullName: {
//             $concat: [
//               "$therapistDetails.firstName",
//               " ",
//               "$therapistDetails.lastName"
//             ]
//           }
//         }
//       }
//     ]);
//     if (!therapists.length) {
//       return res.status(404).json({ message: 'No therapists found with successful transactions' });
//     }
//     const user = {
//       _id: req.user._id,
//       email: req.user.email,
//       fullName: req.user.firstName + " " + req.user.lastName
//     }
//     res.status(200).json({ user, therapists });
//   } catch (error) {
//     console.error('Error fetching therapists with successful transactions:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });
const geTherapistsforChat = asyncHandler(async (req, res) => {
  let pipeline = [
    {
      $match: {
        isActive: true
      }
    },
    {
      $lookup: {
        from: "specializations",
        localField: "specialization",
        foreignField: "_id",
        as: "specializationDetails",
        pipeline: [
          {
            $project: {
             
              name: 1 
            }
          }
        ]
      },
    },
  ];
  // if (search) {
  //   pipeline.push({
  //     $match: {
  //       $or: [
  //         { email: { $regex: search, $options: "i" } },
  //         { mobile: { $regex: search, $options: "i" } },
  //       ],
  //     },
  //   });
  // }
  const user = {
    _id: req.user._id,
    email: req.user.email,
    fullName: req.user.firstName + " " + req.user.lastName
  }
  const therapistListData = await Therapist.aggregate([
    ...pipeline,
    { $sort: { createdAt: 1 } },
    {
      $project: {
        _id: 1,
        name: { $concat: ["$firstName", " ", "$lastName"] },
        bio: 1,
        category: "$specializationDetails"
        // category: {
        //   $reduce: {
        //     input: "$specializationDetails",
        //     initialValue: "",
        //     in: {
        //       $cond: {
        //         if: { $eq: ["$$value", ""] },
        //         then: "$$this.name",
        //         else: { $concat: ["$$value", ", ", "$$this.name"] },
        //       },
        //     },
        //   },
        // },
      },
    },
  ]);

  if (!therapistListData.length) {
    return res.status(404).json(new ApiError(404, "", "No therapists found!"));
  }

  return res.status(200).json(
    new ApiResponse(200, { therapists: therapistListData, user }, "Therapist list fetched successfully")
  );
});

export {
  calculateTotalSales,
  TotalSalesList,
  ListByCategory,
  TotalSalesByDuration,
  getTherapistSessions,
  getTherapistRevenue,
  getUserSessions,
  UserTransactions,
  therapistTransactions,
  thankyou,
  initiateRefund,
  geTherapistsforChat
};
