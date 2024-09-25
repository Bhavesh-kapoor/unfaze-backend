import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { Notification } from "../../models/notification.Model.js";
import { Therapist } from "../../models/therapistModel.js";
import { Session } from "../../models/sessionsModel.js";
import { Transaction } from "../../models/transactionModel.js";
import { User } from "../../models/userModel.js";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";

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
    const {
      dateRange = "today",
      status = "successful",
      page = 1,
      limit = 10,
    } = req.query;

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Data fetched successfully!"));
  } catch (error) {
    console.error(error);
    throw new ApiError(500, error.message);
  }
});
