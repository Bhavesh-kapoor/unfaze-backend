import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { Notification } from "../../models/notification.Model.js";
import { Therapist } from "../../models/therapistModel.js";
import { Session } from "../../models/sessionsModel.js";
import { Transaction } from "../../models/transactionModel.js";
import { User } from "../../models/userModel.js";

export const getOverview = asyncHandler(async (req, res) => {
  const user = req.user; // assuming req.user is already populated (therapist)
  const now = new Date();

  // Get unread notifications (limited to 5) with selected fields
  const notifications = await Notification.find({ status: "unread" })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("message createdAt");

  const users = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select("firstName lastName gender email mobile");

  // Get active therapists with selected fields
  const therapists = await Therapist.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("firstName lastName _id email mobile");

  const { status = "successful", page = 1, limit = 10 } = req.query;
  const pageNumber = parseInt(page, 10);
  const pageSize = parseInt(limit, 10);
  const pipeline = [
    { $match: { payment_status: status } },
    {
      $lookup: {
        from: "specializations", // The collection name for category
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users", // The collection name for user_id
        localField: "user_id",
        foreignField: "_id",
        as: "userData",
      },
    },
    { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "therapists", // The collection name for therapist_id
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
        "userData.email": 1,
        "userData.lastName": 1,
        "userData.firstName": 1,
        "therapistData.email": 1,
        "therapistData.lastName": 1,
        "therapistData.firstName": 1,
      },
    },
    { $skip: (pageNumber - 1) * pageSize },
    { $limit: pageSize },
  ];
  const transactions = await Transaction.aggregate(pipeline).exec();

  // Get sessions for the logged-in therapist with associated transactions
  const sessions = await Session.aggregate([
    { $match: { start_time: { $gte: now } } },
    {
      $lookup: {
        from: "therapists", // therapist details
        localField: "therapist_id",
        foreignField: "_id",
        as: "therapist_details",
      },
    },
    { $unwind: "$therapist_details" },
    {
      $lookup: {
        from: "transactions", // associated transactions
        localField: "transaction_id",
        foreignField: "_id",
        as: "transaction_details",
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
          { $project: { amount: 1, category: "$category.name" } }, // select specific transaction fields
        ],
      },
    },
    {
      $project: {
        startTime: 1,
        endTime: 1,
        therapist_details: {
          firstName: 1,
          lastName: 1,
        },
        transaction_details: 1,
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
        notifications, // Unread notifications
        therapists, // Active therapists
        sessions, // Sessions with transactions
      },
      "Data fetched successfully!"
    )
  );
});
