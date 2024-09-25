import { Refund } from "../models/refundModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Transaction } from "../models/transactionModel.js";
import { Session } from "../models/sessionsModel.js";
import { isBefore, differenceInHours } from "date-fns";
import mongoose from "mongoose";
import { Slot } from "../models/slotModal.js";

const initiateRefund = asyncHandler(async (req, res) => {
    try {
        const user = req.user;
        const { transactionId, refundReason } = req.body;
        if (!transactionId || !refundReason) {
            return res.status()
        }
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json(new ApiError(404, "", "Transaction not found"));
        }
        if (transaction.payment_status !== "successful") {
            return res.status(400).json(new ApiError(400, "", "Only successful transaction can be refunded"));
        }
        if (transaction.type === "single") {
            const currentTime = new Date();
            const startTime = transaction.start_time;

            if (isBefore(startTime, currentTime)) {
                return res.status(400).json(
                    new ApiError(400, "", "refund can only be initiated before session start"))
            }
            const timeDifference = differenceInHours(startTime, currentTime);


            if (timeDifference < 2) {
                return res.status(400).json(
                    new ApiError(400, "", "refund can only be initiated before 2 hour of session start")
                );
            }
            const session = await Session.findOne({ transaction_id: new mongoose.Types.ObjectId(transactionId) });
            if (!session) {
                return res.status(404).json(new ApiError(404, "", "no session found for this transaction "));
            }
            session.status = "cancelled";
            await session.save()
            await Slot.updateOne({
                therapist_id: transaction.therapist_id,
                "timeslots._id": transaction.slotId,
            }, {
                $set: {
                    "timeslots.$.isBooked": false,
                },
            });
        }
        if (transaction.type === "course") {
            const session = await Session.findOne({ transactionId: new mongoose.Types.ObjectId(transactionId) })
            if (session) {
                return res.status(404).json(new ApiError(404, "", " refund can't be processed if any of the session booked or attended "));
            }
        }
        transaction.payment_status = "refund-prosessing";
        await transaction.save()
        const refund = await Refund.create({
            transactionId: transactionId,
            refundReason: refundReason
        });
        if (!refund) {
            throw new ApiError(500, "something went wrong in refund !")
        }
        res.status(200).json(new ApiResponse(200, { refund }, "Refund initiated successfully"));
    } catch (error) {
        console.log(error)
        res.status(500).json(new ApiError(500, "something went wrong!", error.message))
    }

})

const getRefundList = asyncHandler(async (req, res) => {
    try {
        const user = req.user;
        const { page = 1, limit = 10 } = req.query;
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;
        let matchCondition = {};

        // Set the match condition based on the user role
        if (user.role === "user") {
            matchCondition = { "transaction.user_id": new mongoose.Types.ObjectId(req.user._id) };
        } else if (user.role === "therapist") {
            matchCondition = { "transaction.therapist_id": new mongoose.Types.ObjectId(req.user._id) };
        }

        const refundList = await Refund.aggregate([
            {
                $lookup: {
                    from: "transactions",
                    localField: "transactionId",
                    foreignField: "_id",
                    as: "transaction",
                },
            },
            {
                $unwind: "$transaction",
            },
            {
                $match: matchCondition,
            },
            {
                $lookup: {
                    from: "users", // Assuming 'users' is the name of the users collection
                    localField: "transaction.user_id",
                    foreignField: "_id",
                    as: "userDetails",
                },
            },
            {
                $unwind: "$userDetails",
            },
            {
                $lookup: {
                    from: "therapists", // Assuming 'therapists' is the name of the therapists collection
                    localField: "transaction.therapist_id",
                    foreignField: "_id",
                    as: "therapistDetails",
                },
            },
            {
                $unwind: "$therapistDetails",
            },
            {
                $project: {
                    _id: 1,
                    transactionId: "$transactionId",
                    refundReason: 1,
                    refundDate: 1,
                    refundStatus: 1,
                    amountUSD: "$transaction.amount_USD",
                    amountINR: "$transaction.amount_INR",
                    paymentStatus: "$transaction.payment_status",
                    userName: { $concat: ["$userDetails.firstName", " ", "$userDetails.lastName"] },
                    therapistName: { $concat: ["$therapistDetails.firstName", " ", "$therapistDetails.lastName"] },
                },
            },
            {
                $sort: { updatedAt: -1 }
            },
            {
                $skip: skip,
            },
            {
                $limit: limitNumber,
            },
        ]);
        const totalRefunds = await Refund.countDocuments(matchCondition);
        const response = {
            currentPage: page,
            totalPages: Math.ceil(totalRefunds / limit),
            totalRefunds,
            refunds: refundList,
        };

        console.log(refundList);
        res.status(200).json(new ApiResponse(200, response, "Refund list fetched successfully!"));
    } catch (error) {
        console.error(error);
        res.status(500).json(new ApiError(500, "Something went wrong!", error.message));
    }
});


export { initiateRefund, getRefundList }
