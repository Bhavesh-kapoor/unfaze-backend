import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { CorpPackage } from "../../models/corporate/packageModel.js";
import { check, validationResult } from "express-validator";
import { populate } from "dotenv";
import { json } from "express";
import { Organization } from "../../models/corporate/organizationModel.js";

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

    const updatedPackage = await CorpPackage.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!updatedPackage) {
        return res.status(404).json(new ApiError(404, "Package not found"));
    }

    return res.status(200).json(new ApiResponse(200, updatedPackage, "Package updated successfully"));
});

const getPackage = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const corpPackage = await CorpPackage.findById(id);

    if (!corpPackage) {
        return res.status(404).json(new ApiError(404, "Package not found"));
    }

    return res.status(200).json(new ApiResponse(200, corpPackage, "Package retrieved successfully"));
});

// Get List of Packages for admin
const getListOfPackages = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

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
        .populate('organizationId')
        .limit(limitNumber)
        .skip(skip)
        .exec();

    const totalPackages = await CorpPackage.countDocuments(query);

    return res.status(200).json(new ApiResponse(200, {
        result: packages,
        pagination: {
            totalPages: Math.ceil(totalPackages / limitNumber),
            currentPage: pageNumber,
            totalItems: totalPackages,
            itemsPerPage: parseInt(limit)
        }
    }, "Packages retrieved successfully"));
});


// Get All Packages for corp admin

const allPackagesByOrg = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const user = req.user;
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;


    const packages = await CorpPackage.find({ organizationId: user.organizationId })
        .populate('organizationId')
        .limit(limitNumber)
        .skip(skip)
        .exec();

    const totalPackages = await CorpPackage.countDocuments({ organizationId: user.organizationId });

    return res.status(200).json(new ApiResponse(200, {
        result: packages,
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
