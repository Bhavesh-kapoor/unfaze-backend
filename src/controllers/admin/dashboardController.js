import ApiError from "../../utils/ApiError.js";
import { User } from "../../models/userModel.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { Session } from "../../models/sessionsModel.js";
import { Therapist } from "../../models/therapistModel.js";
import { endOfDay, startOfYear, endOfYear, eachMonthOfInterval, format } from "date-fns";
import { Transaction } from "../../models/transactionModel.js";
import { Notification } from "../../models/notification.Model.js";
import { Specialization } from "../../models/specilaizationModel.js";

// Function to generate a random RGB color
const getRandomColor = () => {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return `rgba(${r}, ${g}, ${b}, 0.5)`;
};

export const getOverview = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    const {
      dateRange = "today",
      status = "successful",
      page = 1,
      limit = 10,
    } = req.query;

    // Set up date ranges based on the dateRange query parameter
    const now = new Date();
    let dateStart, dateEnd;

    if (dateRange === "today") {
      dateStart = now;
      dateEnd = endOfDay(now);
    } else {
      dateStart = now;
      dateEnd = endOfMonth(now);
    }
    const notifications = await Notification.find({ status: "unread" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("message createdAt");
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("firstName lastName gender email mobile");
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
          amount_USD: 1,
          amount_INR: 1,
          start_time: 1,
          transactionId: 1,
          payment_status: 1,
          payment_details: 1,
          "category.name": 1,
          user: {
            name: {
              $concat: ["$userData.firstName", " ", "$userData.lastName"],
            },
            email: "$userData.email",
          },
          Therapist: {
            name: {
              $concat: [
                "$therapistData.firstName",
                " ",
                "$therapistData.lastName",
              ],
            },
            email: "$therapistData.email",
          },
        },
      },
      { $skip: (pageNumber - 1) * pageSize },
      { $limit: pageSize },
    ];
    const transactions = await Transaction.aggregate(pipeline).exec();
    const sessionPipeline = [
      {
        $match: {
          start_time: { $gte: dateStart, $lte: dateEnd },
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
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
          as: "user_details",
        },
      },
      { $unwind: "$user_details" },
      {
        $lookup: {
          from: "transactions",
          localField: "transaction_id",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "specializations",
                localField: "category",
                foreignField: "_id",
                as: "category",
              },
            },
            { $unwind: "$category" },
            { $project: { amount: 1, category: "$category.name" } },
          ],
          as: "transaction_details",
        },
      },
      {
        $unwind: "$transaction_details",
      },
      {
        $project: {
          start_time: 1,
          end_time: 1,
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
          category: "$transaction_details.category",
        },
      },
      {
        $sort: { start_time: 1 },
      },
    ];
    const sessions = await Session.aggregate(sessionPipeline);

    // Fetch therapists list
    const therapistslist = await Therapist.aggregate([
      {
        $lookup: {
          from: "specializations",
          localField: "specialization",
          foreignField: "_id",
          as: "specializations",
        },
      },
      {
        $lookup: {
          from: "sessions",
          localField: "_id",
          foreignField: "therapist_id",
          pipeline: [
            {
              $match: {
                start_time: { $gte: dateStart },
                ...(dateEnd && { start_time: { $lte: dateEnd } }), // Apply end time only for "today"
              },
            },
          ],
          as: "sessionsFiltered",
        },
      },
      {
        $addFields: {
          sessionCountFiltered: { $size: "$sessionsFiltered" },
          name: { $concat: ["$firstName", " ", "$lastName"] },
        },
      },
      {
        $match: {
          sessionCountFiltered: { $gt: 0 },
          isActive: true,
        },
      },
      {
        $sort: {
          sessionCountFiltered: -1,
        },
      },
      {
        $limit: 5,
      },
      {
        $project: {
          name: 1,
          email: 1,
          mobile: 1,
          isActive: 1,
          specializations: {
            _id: 1,
            name: 1,
          },
          sessionCountFiltered: 1,
        },
      },
    ]);

    // Return the results using ApiResponse
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          users,
          transactions,
          notifications,
          sessions,
          therapistslist,
        },
        "Data fetched successfully!"
      )
    );
  } catch (error) {
    console.error(error);
    throw new ApiError(500, error.message);
  }
});

export const getOverviewByRevenue = asyncHandler(async (req, res) => {
  try {
    const { currency = "amount_INR" } = req.query;
    const data = await Transaction.aggregate([
      {
        $match: {
          payment_status: "successful",
          createdAt: {
            $gte: startOfYear(new Date()), // Start from the beginning of the year
            $lte: endOfYear(new Date()), // End at the end of the year
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" }, // Group by the month of `createdAt`
            category_id: "$category", // Group by `category_id`
          },
          totalRevenue: { $sum: `$${currency}` }, // Sum the revenue
        },
      },
      { $sort: { "_id.month": 1 } }, // Sort by month
    ]);

    const categoryIds = [...new Set(data.map((item) => item._id.category_id))];
    const categories = await Specialization.find({
      _id: { $in: categoryIds },
    }).select("_id name");

    const categoryMap = {};
    categories.forEach((category) => {
      categoryMap[category._id] = {
        name: category.name,
        revenueData: Array(12).fill(0), // Initialize an array for 12 months
        backgroundColor: getRandomColor(), // Assign a random color
      };
    });

    // Populate the revenue data in the corresponding category and month
    data.forEach(({ _id, totalRevenue }) => {
      const categoryId = _id.category_id;
      if (categoryMap[categoryId]) {
        categoryMap[categoryId].revenueData[_id.month - 1] = totalRevenue;
      }
    });

    // Convert categoryMap into an array format for the final response
    const finalData = Object.values(categoryMap).map((category) => ({
      label: category.name,
      data: category.revenueData,
      backgroundColor: category.backgroundColor, // Include color in the response
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { finalData },
          "Revenue data by category fetched successfully!"
        )
      );
  } catch (error) {
    console.error("Error fetching revenue overview by category:", error);
    throw new ApiError(500, error.message);
  }
});

export const getOverviewBySessions = asyncHandler(async (req, res) => {
  try {
    const statuses = ["missed", "rescheduled", "upcoming", "completed"];
    const data = await Session.aggregate([
      { $match: { status: { $in: statuses } } },
      {
        $group: {
          _id: {
            therapist_id: "$therapist_id",
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "therapists",
          localField: "_id.therapist_id",
          foreignField: "_id",
          as: "therapist_info",
        },
      },
      {
        $unwind: "$therapist_info",
      },
      {
        $sort: { "_id.therapist_id": 1, "_id.status": 1 },
      },
    ]);

    // Initialize session data structure for each status
    const sessionData = statuses.reduce((acc, status) => {
      acc[status] = {
        labels: [], // Therapist names
        datasets: [
          {
            label: `${status.charAt(0).toUpperCase() + status.slice(1)
              } Sessions`,
            data: [],
            backgroundColor: getRandomColor(), // Generate a random color for the background
            hoverOffset: 4,
          },
        ],
      };
      return acc;
    }, {});

    data.forEach(({ _id, count, therapist_info }) => {
      const { status } = _id;
      sessionData[status].labels.push(
        therapist_info.firstName + " " + therapist_info?.lastName
      );
      sessionData[status].datasets[0].data.push(count);
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          sessionData,
          "Successfully fetched session overview!"
        )
      );
  } catch (error) {
    console.error("Error fetching session overview:", error);
    throw new ApiError(500, error.message);
  }
});
export const getTransactionsAndSessionsByMonth = asyncHandler(async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const start = startOfYear(new Date(year, 0, 1));
    const end = endOfYear(new Date(year, 11, 31));

    const months = eachMonthOfInterval({ start, end }).map(month => format(month, 'MMMM'));

    // Aggregation pipeline to calculate sessions and revenue
    const transactions = await Transaction.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'courseDetails',
        },
      },
      {
        $addFields: {
          courseSessions: {
            $cond: {
              if: { $eq: ['$type', 'course'] },
              then: { $arrayElemAt: ['$courseDetails.sessionOffered', 0] },
              else: 1,
            },
          },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          totalSessions: { $sum: '$courseSessions' },
          totalRevenueUSD: { $sum: '$amount_USD' },
          totalRevenueINR: { $sum: '$amount_INR' },
        },
      },
      {
        $sort: { '_id': 1 },
      },
    ]);

    // Initialize response with zero data for each month
    const response = months.map((month, index) => ({
      label: month,
      totalSessions: 0,
      totalRevenueUSD: 0,
      totalRevenueINR: 0
    }));

    // Map the aggregated data to the corresponding month
    transactions.forEach(transaction => {
      const monthIndex = transaction._id - 1;
      response[monthIndex].totalSessions = transaction.totalSessions;
      response[monthIndex].totalRevenueUSD = transaction.totalRevenueUSD;
      response[monthIndex].totalRevenueINR = transaction.totalRevenueINR;
    });

    // Prepare the final datasets structure
    const finalResponse = {
      datasets: [
        {
          label: "Number of Sessions",
          data: response.map(item => item.totalSessions),
          borderColor: "rgb(75, 192, 192)",
          tension: 0.3,
          fill: true,
        },
        {
          label: "Revenue (USD)",
          data: response.map(item => item.totalRevenueUSD),
          borderColor: "rgb(54, 162, 235)",
          tension: 0.3,
          fill: true,
        },
        {
          label: "Revenue (INR)",
          data: response.map(item => item.totalRevenueINR),
          borderColor: "rgb(255, 159, 64)",
          tension: 0.3,
          fill: true,
        }
      ]
    };
    res.status(200).json(new ApiResponse(200, finalResponse, "data fatched successfully"));
  } catch (error) {
    console.error(error);
    res.status(500).json(new ApiError(500, 'Server error', error));
  }
});
