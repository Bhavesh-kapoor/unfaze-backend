import { Refund } from "../models/refundModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Transaction } from "../models/transactionModel.js";
import { Session } from "../models/sessionsModel.js";

const initiateRefund = asyncHandler(async (req, res) => {
    const user = req.user;
    const { transactionId } = req.params;
    const { reason } = req.body;
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
        return res.status(404).json(new ApiError(404, "", "Transaction not found"));
    }
    if (transaction.type == "single") {
        const session = await Session.findOne({ transactionId: new mongoose.Types.objectId(transactionId) })
        if (!session) {
            return res.status(404).json(new ApiError(404, "", "no session found for this transaction "));
        }
        session.status = "cancelled";
        await session.save()
    }

    const refund = await Refund.create({
        transactionId: transactionId,
        refundReason: req.body.reason
    });

})