import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { Session } from "../../models/sessionsModel.js";
import { Therapist } from "../../models/therapistModel.js";
import { Transaction } from "../../models/transactionModel.js";
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

    // Ensure the result object is returned correctly
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

const getTherapistSessions = async (req, res) => {
  try {

    const user = req.user;
    console.log(user)
    let therapistId;
    if (user.role === "admin") {
      therapistId = req.query.therapistId;
    } else {
      therapistId = req.user?._id;
    }
    const { status = "upcoming" } = req.query;
    if (!therapistId || !status) {
      return res
        .status(400)
        .json(new ApiError(400, null, "therapistID is required!"));
    }
    const userTransactions = await Transaction.aggregate([
      {
        $match: { therapist_id: therapistId },
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
        $lookup: {
          from: "users",
          localField: "category",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1 } }],
          as: "category",
        },
      },
      {
        $project: {
          transactionId: 1,
          createdAt: 1,
          therapist_Name: {
            $concat: [
              "$therapist_details.firstName",
              " ",
              "$therapist_details.lastName",
            ],
          },
          category: "$category.name",
          amount: {
            $ifNull: ["$amount_USD", "$amount_INR"],
          },
        },
      },
    ]);
    if (!userTransactions.length) {
      return res
        .status(404)
        .json(new ApiResponse(200, [], "No transactions found for this user"));
    }

    if (sessions.length === 0) {
      return res.status(404).json({ message: "No sessions found" });
    }

    res.status(200).json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

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

const getUserSessions = async (req, res) => {
  try {
    const user = req.user;
    console.log(user);
    console.log(user);
    if (!user) {
      return res
        .status(400)
        .json(new ApiError(400, null, "User ID is required!"));
    }
    const sessions = await Session.find({ user_id: user._id })
      .populate({
        path: "therapist_id",
        select: "firstName lastName email mobile",
      })
      .populate({
        path: "transaction_id",
        populate: {
          path: "category",
          select: "name ",
        },
      })
      .lean()
      .then((sessions) => {
        console.log(sessions)
        return sessions.map((session) => ({
          _id: session._id,
          therapistName: `${session.therapist_id?.firstName} ${session.therapist_id?.lastName}`,
          categoryName: session.transaction_id.category?.name || "",
          startTime: session.start_time,
          status: session.status,
          channelName: session.channelName,
        }));
      });
    if (!sessions.length) {
      return res
        .status(404)
        .json(
          new ApiResponse(200, [], "You are not enrolled in any sessions!")
        );
    }
    return res
      .status(200)
      .json(new ApiResponse(200, sessions, "Sessions fetched successfully!"));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const UserTransactions = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "User ID is required!"));
  }

  const userTransactions = await Transaction.aggregate([
    {
      $match: { user_id: user._id },
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
            "$therapist_details?.firstName",
            " ",
            "$therapist_details?.lastName",
          ],
        },
        category: "$category.name",
        amount: {
          $ifNull: ["$amount_USD", "$amount_INR"],
        },
      },
    },
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


export {
  calculateTotalSales,
  TotalSalesList,
  ListByCategory,
  TotalSalesByDuration,
  getTherapistSessions,
  getTherapistRevenue,
  getUserSessions,
  UserTransactions,
};
