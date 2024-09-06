import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { Session } from "../../models/sessionsModel.js";
import { Therapist } from "../../models/therapistModel.js";
import { User } from "../../models/userModel.js";
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
    is_active: true,
  });
  const totalActiveUser = await User.countDocuments({
    // is_active: true,
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

const TotalSalesByDuration = asyncHandler(async (req, res) => {
  const now = new Date();

  // Define the date ranges for different periods using a date library like date-fns
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
    const result = await Session.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
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
          totalSales: { $sum: "$transaction_details.amount" },
          count: { $sum: 1 },
        },
      },
    ]);
    return result[0] || { totalSales: 0, count: 0 };
  };

  // Function to get the count of newly created users within a time range
  const getNewUserCount = async (startDate, endDate) => {
    return await User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });
  };

  // Days and hours passed calculations
  const daysPassedInCurrentWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
  const daysPassedInCurrentMonth = now.getDate(); // Day of the month (1-31)
  const daysPassedInCurrentYear = Math.floor(
    (now - new Date(now.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24)
  );
  const hoursPassedToday = now.getHours(); // Current hour of the day (0-23)

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
    const result = await Session.aggregate([
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
          totalSales: { $sum: "$transaction_details.amount" },
          count: { $sum: 1 },
        },
      },
    ]);
    return result[0] || { totalSales: 0, count: 0 };
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
    Therapist.countDocuments({ is_active: true }),
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
        current: salesToday.totalSales / 100,
        last: salesYesterday.totalSales / 100,
        comparative: salesComparativeDay.totalSales / 100,
        countsCurrent: salesToday.count,
        countsLast: salesYesterday.count,
        countsComparative: salesComparativeDay.count,
        currentUserCount: newUsersToday,
        lastUserCount: newUsersYesterday,
      },
      weeks: {
        current: salesThisWeek.totalSales / 100,
        last: salesLastWeek.totalSales / 100,
        comparative: salesComparativeWeek.totalSales / 100,
        countsCurrent: salesThisWeek.count,
        countsLast: salesLastWeek.count,
        countsComparative: salesComparativeWeek.count,
        currentUserCount: newUsersThisWeek,
        lastUserCount: newUsersLastWeek,
      },
      months: {
        current: salesThisMonth.totalSales / 100,
        last: salesLastMonth.totalSales / 100,
        comparative: salesComparativeMonth.totalSales / 100,
        countsCurrent: salesThisMonth.count,
        countsLast: salesLastMonth.count,
        countsComparative: salesComparativeMonth.count,
        currentUserCount: newUsersThisMonth,
        lastUserCount: newUsersLastMonth,
      },
      years: {
        current: salesThisYear.totalSales / 100,
        last: salesLastYear.totalSales / 100,
        comparative: salesComparativeYear.totalSales / 100,
        countsCurrent: salesThisYear.count,
        countsLast: salesLastYear.count,
        countsComparative: salesComparativeYear.count,
        currentUserCount: newUsersThisYear,
        lastUserCount: newUsersLastYear,
      },
      allTime: {
        current: totalSalesOfAllTime.totalSales / 100,
        last: null,
        comparative: null,
        countsCurrent: totalSalesOfAllTime.count,
        countsLast: null,
        countsComparative: null,
        currentUserCount: totalActiveUser,
        lastUserCount: null,
      },
      total: totalActiveTherapist,
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
  console.log(data);
  return res.status(200).json({ data });
});

export {
  calculateTotalSales,
  TotalSalesList,
  ListByCategory,
  TotalSalesByDuration,
};
