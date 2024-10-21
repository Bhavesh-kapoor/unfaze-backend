import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { CorpPackage } from "../../models/corporate/packageModel.js";
import { body, check, validationResult } from "express-validator";
import { Organization } from "../../models/corporate/organizationModel.js";
import { PackageDistribution } from "../../models/corporate/packageDistributionModel.js";
import { ObjectId } from "mongodb";
import mongoose, { Types } from "mongoose";
import { json } from "express";

// Validation middleware
const validateRegister = [
    check("organizationId", "organizationId is required").notEmpty(),
    check("TotalSession", "TotalSession is required").notEmpty(),
    check("currency", "currency is required").notEmpty(),
    check("price", "price is required").notEmpty(),
    check("specializationId", "specializationId is required").notEmpty(),
];

// Create Package
const createPackage = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json(new ApiError(400, "Validation Error", errors.array()));
    }

    const corpPackage = await CorpPackage.create({
        ...req.body,
        remainingSessions: req.body.TotalSession
    });

    if (!corpPackage) {
        return res.status(500).json(new ApiError(500, "Failed to create package"));
    }

    return res.status(201).json(new ApiResponse(201, corpPackage, "Corporate package created successfully!"));
});

// Update Package
const updatePackage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { TotalSession } = req.body;

    const disSessionCount = await PackageDistribution.aggregate([
        {
            $match: { mainPackageId: new mongoose.Types.ObjectId(id) }
        },
        {
            $group: {
                _id: null,
                usedSessionsCount: { $sum: "$sesAllotted" }
            }
        }
    ]);

    if (!disSessionCount.length) {
        return res.status(404).json(new ApiError(404, "No sessions found for this package."));
    }

    if (disSessionCount[0].usedSessionsCount >= TotalSession) {
        return res.status(400).json(new ApiError(400, null, "Total Session should be greater than sessions allotted by Corporate Admin!"));
    }

    const existingPackage = await CorpPackage.findById(id);
    if (!existingPackage) {
        return res.status(404).json(new ApiError(404, "Package not found"));
    }
    const difference = TotalSession - existingPackage.TotalSession;
    const remainingSessions = existingPackage.remainingSessions + difference;
    const updatedPackage = await CorpPackage.findByIdAndUpdate(
        id,
        { ...req.body, remainingSessions },
        {
            new: true,
            runValidators: true,
        }
    );

    if (!updatedPackage) {
        return res.status(404).json(new ApiError(404, "Failed to update package"));
    }
    return res.status(200).json(new ApiResponse(200, updatedPackage, "Package updated successfully"));
});

const getPackage = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const corpPackage = await CorpPackage.findById(id)
        .populate("organizationId", "name")
        .populate("specializationId", "name");

    if (!corpPackage) {
        return res.status(404).json(new ApiError(404, "Package not found"));
    }
    const flattenedPackage = {
        _id: corpPackage._id,
        organizationId: corpPackage.organizationId._id,
        organizationName: corpPackage.organizationId.name,
        specializationId: corpPackage.specializationId._id,
        specializationName: corpPackage.specializationId.name,
        TotalSession: corpPackage.TotalSession,
        currency: corpPackage.currency,
        price: corpPackage.price,
        isActive: corpPackage.isActive,
        remainingSessions: corpPackage.remainingSessions,
        createdAt: corpPackage.createdAt,
        updatedAt: corpPackage.updatedAt,
        __v: corpPackage.__v,
    };

    return res
        .status(200)
        .json(new ApiResponse(200, flattenedPackage, "Package retrieved successfully"));
});


// Get List of Packages for admin
const getListOfPackages = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    try {
        let organizationIds = [];

        if (search) {
            const organizations = await Organization.find({
                name: { $regex: search, $options: "i" }
            }).select('_id');

            organizationIds = organizations.map(org => org._id);
        }
        const query = search
            ? { organizationId: { $in: organizationIds } }
            : {};

        const packages = await CorpPackage.find(query)
            .populate("organizationId", "name")
            .populate("specializationId", "name")
            .limit(limitNumber)
            .skip(skip)
            .exec();

        const result = packages.map((item) => {
            return {
                _id: item._id,
                organizationId: item.organizationId?._id,
                organizationName: item.organizationId?.name,
                specializationId: item.specializationId?._id,
                specializationName: item.specializationId?.name,
                TotalSession: item.TotalSession,
                currency: item.currency,
                price: item.price,
                isActive: item.isActive,
                remainingSessions: item.remainingSessions,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                __v: item.__v
            }
        })

        const totalPackages = await CorpPackage.countDocuments(query);

        return res.status(200).json(new ApiResponse(200, {
            result: result,
            pagination: {
                totalPages: Math.ceil(totalPackages / limitNumber),
                currentPage: pageNumber,
                totalItems: totalPackages,
                itemsPerPage: parseInt(limit)
            }
        }, "Packages retrieved successfully"));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiError(500, null, error.message));
    }
});


// Get All Packages for corp admin

const allPackagesByOrg = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const user = req.user;
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    console.log(user)
    const packages = await CorpPackage.find({ organizationId: user.organizationId })
        .populate('organizationId', 'name')
        .populate('specializationId', 'name')
        .limit(limitNumber)
        .skip(skip)
        .exec();

    const totalPackages = await CorpPackage.countDocuments({ organizationId: user.organizationId });

    const result = packages.map((item) => {
        return {
            _id: item._id,
            organizationId: item.organizationId._id,
            organizationName: item.organizationId.name,
            specializationId: item.specializationId._id,
            specializationName: item.specializationId.name,
            TotalSession: item.TotalSession,
            currency: item.currency,
            price: item.price,
            isActive: item.isActive,
            remainingSessions: item.remainingSessions,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            __v: item.__v
        }
    })
    return res.status(200).json(new ApiResponse(200, {
        result: result,
        pagination: {
            totalPages: Math.ceil(totalPackages / limitNumber),
            currentPage: pageNumber,
            totalItems: totalPackages,
            itemsPerPage: parseInt(limit)
        }
    }, "Packages retrieved successfully"));
});

const deletePackage = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deletedPackage = await CorpPackage.findByIdAndDelete(id);

    if (!deletedPackage) {
        return res.status(404).json(new ApiError(404, "Package not found"));
    }

    return res.status(200).json(new ApiResponse(200, null, "Package deleted successfully"));
});

export {
    validateRegister,
    createPackage,
    updatePackage,
    getPackage,
    getListOfPackages,
    allPackagesByOrg,
    deletePackage
};
