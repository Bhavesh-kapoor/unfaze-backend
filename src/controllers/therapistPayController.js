import { TherapistPay } from "../models/therapistPayModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { check, validationResult } from "express-validator";
import mongoose from "mongoose";

const payValidation = [
    check('inrPay', 'Coupon code is required').notEmpty(),
    check('usdPay', 'Expiry date of coupon is required').notEmpty(),
    check('therapistId', 'Therapist ID must be a valid MongoDB ObjectId').notEmpty().isMongoId(),
    check('specializationId', 'Specialization ID must be a valid MongoDB ObjectId').notEmpty().isMongoId(),
];

const createPay = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json(new ApiError(400, "", errors.array()));
    }
    try {
        const { inrPay, usdPay, specializationId, therapistId } = req.body;
        const therapist = await TherapistPay.findOne({
            $and: [
                { therapistId: therapistId },
                { specializationId: specializationId }
            ]
        });
        if (therapist) {
            throw new ApiError(400, "Therapist already exists for this specialization!");
        }
        const therapistPay = await TherapistPay.create({ inrPay, usdPay, specializationId, therapistId });
        if (!therapistPay) {
            throw new ApiError(400, "Failed to create payment!");
        }
        res.status(201).json(new ApiResponse(201, therapistPay, "therapist payment  created successfully!"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiError(500, "somthing went wrong", error.message))
    }
});
const updatePay = asyncHandler(async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json(new ApiError(400, "", errors.array()));
        }
        const { _id } = req.params
        const { inrPay, usdPay } = req.body;
        const pay = await TherapistPay.findByIdAndUpdate(
            _id,
            { inrPay, usdPay },
            { new: true }
        );
        if (!pay) {
            throw new ApiError(404, "Document not found!");
        }
        res.status(200).json(new ApiResponse(200, " Therapist Payment updated successfully!", pay));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiError(500, "somthing went wrong", error.message))
    }
});
const findByTherapistId = asyncHandler(async (req, res) => {
    try {
        const { therapistId } = req.params;

        // Ensure therapistId is a valid ObjectId
        const list = await TherapistPay.find({ therapistId: new mongoose.Types.ObjectId(therapistId) })
            .populate("therapistId", "firstName lastName")
            .populate("specializationId", "name");

        // Check if the list is empty
        if (!list || list.length === 0) {
            return res.status(404).json(new ApiResponse(404, [], "No data available!"));
        }

        // Process the list and format the response
        const result = list.map((item) => {
            return {
                _id: item._id,
                therapistName: `${item.therapistId.firstName} ${item.therapistId.lastName}`,
                specialization: item.specializationId.name,
                inrPay: item.inrPay,
                usdPay: item.usdPay,
                createdAt: item.createdAt,
            };
        });

        res.status(200).json(new ApiResponse(200, result, "Payment list retrieved successfully!"));
    } catch (error) {
        console.error(error);
        res.status(500).json(new ApiError(500, "Something went wrong", error.message));
    }
});

const deletePay = asyncHandler(async (req, res) => {
    try {
        const { _id } = req.params;
        const deletedPay = await TherapistPay.findByIdAndDelete(_id);
        if (!deletedPay) {
            throw new ApiError(400, "invalid document Id!");
        }
        res.status(200).json(new ApiResponse(200, deletedPay, "Payment deleted successfully!"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiError(500, "somthing went wrong", error.message))
    }
});
// const listbyCategory = asyncHandler(async (req, res) => {

// });

export { payValidation, createPay, updatePay, findByTherapistId, deletePay }