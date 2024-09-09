import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { Notification } from "../../models/notification.Model.js";
import { Therapist } from "../../models/therapistModel.js";
import { User } from "../../models/userModel.js";
import { Session } from "../../models/sessionsModel.js";
import { Transaction } from "../../models/transactionModel.js";

export const getOverview = asyncHandler(async (req, res) => {
    const now = new Date()
    const notifications = await Notification.find({
        status: "unread",
    }).sort({ createdAt: -1 }).limit(5);
    const therapists = await Session.aggregate([
        {
            $match: {
                startTime: { $gte: now }
            }
        },
        
        {
            $lookup: {
                from: "therapists",
                localField: "therapistId",
                foreignField: "_id",
                as: "therapist_details",
                pipeline: [
                    { $project: { firstName: 1, lastName: 1 } }
                ]
            }
        },
        {
            $lookup: {
                from: "transactions",
                localField: "transaction_id",
                foreignField: "_id",
                as: "transaction_details",
                pipeline: [

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
                    { $project: { firstName: 1, lastName: 1 } }
                ]
            }
        }
    ]);
    console.log(therapists)
})

