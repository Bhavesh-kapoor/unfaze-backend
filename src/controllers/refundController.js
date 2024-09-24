import { Refund } from "../models/refundModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Transaction } from "../models/transactionModel.js";

const initiateRefund = asyncHandler(async (req, res) => {
    const user  = req.user;
    const {transactionId} =req.params;
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
        return res.status(404).json(new ApiError(404, "", "Transaction not found"));
    }
})