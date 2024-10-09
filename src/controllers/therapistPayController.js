import { TherapistPay } from "../models/therapistPayModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { body, check, validationResult } from "express-validator";
import mongoose from "mongoose";
import { isValidObjectId } from "../utils/mongooseUtility.js";
import { json } from "express";

const payValidation = [
    check('inrPay', 'inrPay is required').notEmpty(),
    check('usdPay', 'usdPay is required').notEmpty(),
    check('therapistId', 'Therapist ID must be a valid MongoDB ObjectId').notEmpty().isMongoId(),
    check('specializationId', 'Specialization ID must be a valid MongoDB ObjectId').notEmpty().isMongoId(),
];
const createPay = asyncHandler(async (req, res) => {
    try {
        const { therapistId, data } = req.body;
        const existingTherapists = await TherapistPay.find({
            therapistId,
            specializationId: { $in: data.map(item => item.specializationId) }
        });

        const existingSpecializationIds = existingTherapists.map(item => item.specializationId.toString());
        const newPayments = data.filter(item => !existingSpecializationIds.includes(item.specializationId));

        if (newPayments.length === 0) {
            return res.status(200).json(new ApiResponse(200, null, "All provided specializations already exist for this therapist!"));
        }

        const therapistPayments = newPayments.map(item => ({
            inrPay: item.inrPay,
            usdPay: item.usdPay,
            specializationId: item.specializationId,
            therapistId
        }));

        const createdPayments = await TherapistPay.insertMany(therapistPayments);

        res.status(201).json(new ApiResponse(201, createdPayments, "Therapist payments created successfully for new specializations!"));
    } catch (error) {
        console.error(error);
        res.status(500).json(new ApiError(500, "Something went wrong", [error]));
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
const getAllMonetizations = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        let matchCondition = {};

        if (search) {
            matchCondition = {
                'therapistDetails.firstName': { $regex: search, $options: 'i' }
            };
        }

        // Aggregation pipeline
        const pipeline = [
            {
                $lookup: {
                    from: 'therapists',
                    localField: 'therapistId',
                    foreignField: '_id',
                    as: 'therapistDetails'
                }
            },
            {
                $unwind: '$therapistDetails'
            },
            {
                $lookup: {
                    from: 'specializations',
                    localField: 'specializationId',
                    foreignField: '_id',
                    as: 'specializationDetails'
                }
            },
            {
                $unwind: '$specializationDetails'
            },
            {
                $match: matchCondition
            },
            {
                $project: {
                    _id: 1,
                    therapist: {
                        $concat: ['$therapistDetails.firstName', ' ', '$therapistDetails.lastName']
                    },
                    category: '$specializationDetails.name',
                    maxInrPrice: '$specializationDetails.inrPrice',
                    maxUsdPrice: '$specializationDetails.usdPrice',
                    inrPay: 1,
                    usdPay: 1
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limitNumber
            }
        ];

        const allMonetizations = await TherapistPay.aggregate(pipeline);

        const totalPipeline = [
            {
                $lookup: {
                    from: 'therapists',
                    localField: 'therapistId',
                    foreignField: '_id',
                    as: 'therapistDetails'
                }
            },
            {
                $unwind: '$therapistDetails'
            },
            {
                $match: matchCondition
            }
        ];

        const total = (await TherapistPay.aggregate(totalPipeline)).length;

        res.status(200).json(new ApiResponse(200, {
            result: allMonetizations,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(total / limitNumber),
                totalItems: total,
                itemsPerPage: limitNumber
            }
        }, "Monetization list fetched successfully!"));
    } catch (error) {
        console.error(error);
        res.status(500).json(new ApiError(500, "failed to fatch monetization list", [error]));
    }
});

const getById = asyncHandler(async (req, res) => {
    try {
        const { _id } = req.params
        if (!isValidObjectId(_id)) {
            return res.status(400).json(new ApiResponse(400, null, "Invalid document ID!"))
        }
        const therapistPay = await TherapistPay.findById(_id).populate("specializationId", "name inrPrice usdPrice").populate('therapistId', "firstName lastName")
        if (!therapistPay) {
            throw new ApiError(404, "No data found")
        }
        const result = {
            _id: _id,
            therapistName: `${therapistPay.therapistId.firstName} ${therapistPay.therapistId.lastName}`,
            specialization: therapistPay.specializationId.name,
            inrPay: therapistPay.inrPay,
            usdPay: therapistPay.usdPay,
            usdPrice: therapistPay.specializationId.usdPrice,
            inrPrice: therapistPay.specializationId.inrPrice,
            createdAt: therapistPay.createdAt,
        }
        return res.status(200).json(new ApiResponse(200, result, "Data fatched successfully"))
    } catch (error) {
        console.log(error)
        res.status(500).json(new ApiError(500, "Failed to fetch therapist pay"))
    }
});

export { payValidation, createPay, updatePay, findByTherapistId, deletePay, getAllMonetizations, getById }