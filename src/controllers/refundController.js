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
            return res.status(403).json((new ApiError(403, "", "transactionId and refundReason is required!")))
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
                return res
                    .status(400)
                    .json(
                        new ApiError(
                            400,
                            "",
                            "refund can only be initiated before session start"
                        )
                    );
            }
            const timeDifference = differenceInHours(startTime, currentTime);

            if (timeDifference < 2) {
                return res
                    .status(400)
                    .json(
                        new ApiError(
                            400,
                            "",
                            "refund can only be initiated before 2 hour of session start"
                        )
                    );
            }
            const session = await Session.findOne({
                transaction_id: new mongoose.Types.ObjectId(transactionId),
            });
            if (!session) {
                return res
                    .status(404)
                    .json(
                        new ApiError(404, "", "no session found for this transaction ")
                    );
            }
            session.status = "cancelled";
            await session.save();
            await Slot.updateOne(
                {
                    therapist_id: transaction.therapist_id,
                    "timeslots._id": transaction.slotId,
                },
                {
                    $set: {
                        "timeslots.$.isBooked": false,
                    },
                }
            );
        }
        if (transaction.type === "course") {
            const session = await Session.findOne({
                transactionId: new mongoose.Types.ObjectId(transactionId),
            });
            if (session) {
                return res
                    .status(404)
                    .json(
                        new ApiError(
                            404,
                            "",
                            " refund can't be processed if any of the session booked or attended "
                        )
                    );
            }
        }
        transaction.payment_status = "refund-prosessing";
        await transaction.save();
        const refund = await Refund.create({
            transactionId: transactionId,
            refundReason: refundReason,
        });
        if (!refund) {
            throw new ApiError(500, "something went wrong in refund !");
        }
        res
            .status(200)
            .json(new ApiResponse(200, { refund }, "Refund initiated successfully"));
    } catch (error) {
        console.log(error);
        res
            .status(500)
            .json(new ApiError(500, "something went wrong!", error.message));
    }
});

const getRefundList = asyncHandler(async (req, res) => {
    try {
        const user = req.user;
        const { page = 1, limit = 10 } = req.query;
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;


        const matchCondition = user.role === "user"
            ? { "transaction.user_id": new mongoose.Types.ObjectId(req.user._id) }
            : user.role === "therapist"
                ? { "transaction.therapist_id": new mongoose.Types.ObjectId(req.user._id) }
                : {};

        const [refundResults] = await Refund.aggregate([
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
                    from: "users",
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
                    from: "therapists",
                    localField: "transaction.therapist_id",
                    foreignField: "_id",
                    as: "therapistDetails",
                },
            },
            {
                $unwind: "$therapistDetails",
            },
            {
                $sort: { updatedAt: -1 },
            },
            {
                $facet: {
                    total: [
                        { $count: "total" },
                    ],
                    refunds: [
                        { $skip: skip },
                        { $limit: limitNumber },
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
                    ],
                },
            },
        ]);

        const totalItems = refundResults.total.length > 0 ? refundResults.total[0].total : 0;
        const refundList = refundResults.refunds;
        res.status(200).json(new ApiResponse(200, {
            result: refundList,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalItems / limitNumber),
                totalItems,
                itemsPerPage: limitNumber,
            },
        }, "Refund list fetched successfully!"));
    } catch (error) {
        console.error(error);
        res.status(500).json(new ApiError(500, "Something went wrong!", error.message));
    }
});
const acceptRefund = asyncHandler(async (req, res) => {
    const { refundStatus } = req.body;
    const user = req.user;
    console.log()
    if (user.role !== "admin") {
        return res.status(403).json(new ApiError(403, "", "Only admin can accept refund"));
    }
    try {
        const { refundId } = req.params
        if (!refundId) {
            return res.status(400).json(new ApiError(400, "", "Refund id is required!"))
        }
        const refund = await Refund.findById(refundId)
        if (!refund) {
            return res.status(404).json(new ApiError(404, "", "Refund not found!"))
        }
        const transaction = await Transaction.findById(refund.transactionId)
        if (!transaction) {
            return res.status(404).json(new ApiError(404, "", "Transaction not found!"))
        }
        if (refundStatus === "approved") {
            refund.refundStatus = "approved"
            await refund.save()
            transaction.payment_status = "refunded"
            await transaction.save()
            return res.status(200).json(new ApiResponse(200, { refund }, "Refund request marked as approved!"))
        } else if (refundStatus === "rejected") {
            refund.refundStatus = "rejected"
            await refund.save()
            transaction.payment_status = "successful"
            await transaction.save()
            return res.status(200).json(new ApiResponse(200, { refund }, " refund request marked as rejected!"))
        }
    } catch (error) {
        console.log(error)
        res.status(500).json(new ApiError(500, "something went wrong in acceptRefund request"))
    }
})


export { initiateRefund, getRefundList, acceptRefund }
