import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { PackageDistribution } from "../../models/corporate/packageDistributionModel.js";
import { validationResult, check, body } from "express-validator";
import { CorpPackage } from "../../models/corporate/packageModel.js";
import { isValidObjectId } from "../../utils/mongooseUtility.js";
import mongoose from "mongoose";
import { User } from "../../models/userModel.js";

const validate = [
    check("userId", "userId is required").notEmpty(),
    check("mainPackageId", "mainPackageId is required").notEmpty(),
    check("sesAllotted", "sesAllotted is required").notEmpty(),
];

const AllotSessionsTocorpUser = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json(new ApiError(400, "Validation Error", errors.array()));
    }
    const { userId, mainPackageId, sesAllotted } = req.body;
    const user = req.user
    if (user.role !== "corp-admin") {
        return res.status(403).json(new ApiError(403, null, "Only corporate admin can allot sessions!"));
    }
    try {
        if (!isValidObjectId(userId) || !isValidObjectId(mainPackageId)) {
            return res.status(400).json(new ApiError(400, null, "Invalid userId or mainPackageId!"));
        }
        const mainPackage = await CorpPackage.findById(mainPackageId);
        if (!mainPackage) {
            return res.status(400).json(new ApiError(400, null, "mainPackageId is invalid!"));
        }
        if (!user.organizationId.equals(mainPackage.organizationId)) {
            return res.status(403).json(new ApiError(403, null, "You are not authorized to allot sessions under this package."));
        }
        if (mainPackage.remainingSessions < sesAllotted) {
            return res.status(200).json(new ApiResponse(200, { remainingSessions: mainPackage.remainingSessions }, "Not enough sessions available in main package."));
        }
        const existingDistribution = await PackageDistribution.findOne({ userId, mainPackageId });
        if (existingDistribution) {
            return res.status(400).json(new ApiError(400, null, "Sessions already allotted for this user under this package."));
        }
        console.log("existingDistribution", existingDistribution)
        const packageDistribution = new PackageDistribution({
            userId,
            mainPackageId,
            sesAllotted,
        });
        await packageDistribution.save();
        mainPackage.remainingSessions = mainPackage.remainingSessions - sesAllotted;
        if (mainPackage.remainingSessions === 0) {
            mainPackage.isActive = false;
        }
        await mainPackage.save();
        res.status(201).json(new ApiResponse(201, packageDistribution, "Sessions allotted successfully"))
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiError(500, null, error.message))
    }
});

const editAllottedSessions = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json(new ApiError(400, "Validation Error", errors.array()));
    }
    const user = req.user
    if (user.role !== "corp-admin" && !user.organizationId.equals(mainPackage.organizationId)) {
        return res.status(403).json(new ApiError(403, null, "Only corporate admin can edit sessions!"));
    }
    const { distributionId } = req.params;
    const { sesAllotted } = req.body;

    try {
        const packageDistribution = await PackageDistribution.findById(distributionId);
        if (!packageDistribution) {
            return res.status(404).json(new ApiError(404, null, "Package distribution not found"));
        }
        const mainPackage = await CorpPackage.findById(packageDistribution.mainPackageId);
        if (!mainPackage) {
            return res.status(404).json(new ApiError(404, null, "Main package not found"));
        }
        if (!user.organizationId.equals(mainPackage.organizationId)) {
            return res.status(403).json(new ApiError(403, null, "You are not authorized to allot sessions under this package."));
        }
        const difference = sesAllotted - packageDistribution.sesAllotted;
        if (difference > mainPackage.remainingSessions) {
            return res.status(400).json(new ApiError(400, null, "Not enough sessions available in main package."));
        }
        if (difference < 0 && packageDistribution.sesAllotted === packageDistribution.used) {
            return res.status(400).json(new ApiError(400, null, "There is no session remaining to reduce!"));
        }
        packageDistribution.sesAllotted += difference;
        mainPackage.remainingSessions -= difference;
        if (mainPackage.remainingSessions === 0) {
            mainPackage.isActive = false;
        }
        await packageDistribution.save();
        await mainPackage.save();
        return res.status(200).json(new ApiResponse(200, { package: packageDistribution }, "Session allotment updated successfully"))
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiError(500, null, error.message))
    }
})

const getAllottedSession = asyncHandler(async (req, res) => {
    const user = req.user;
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    let userId;
    if (user.role === "corp-user") {
        userId = user._id;
    } else {
        userId = req.params.userId;
    }
    try {
        const packageDistributions = await PackageDistribution.find({ userId: new mongoose.Types.ObjectId(userId) })
            .populate({
                path: "mainPackageId",
                populate: {
                    path: "specializationId",
                    select: "name"
                }
            })
            .populate("userId", "firstName lastName");
        if (!packageDistributions) {
            return res.status(404).json(new ApiError(404, null, "Package distribution not found"));
        }
        const totalDistObj = await PackageDistribution.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
        const flattenedResponse = packageDistributions.map((item) => {
            return {
                _id: item._id,
                userId: item.userId._id,
                userName: `${item.userId.firstName} ${item.userId.lastName}`,
                category: item.mainPackageId.specializationId.name,
                sessions: item.sesAllotted,
                usedSessions: item.used,
                isActive: item.isActive,
                createdAt: item.createdAt,
            }
        })
        return res.status(200).json(new ApiResponse(200, {
            result: flattenedResponse,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalDistObj / limitNumber),
                totalItems: totalDistObj,
                itemsPerPage: limitNumber,
            },
        }, "Allotted session retrieved successfully"));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiError(500, null, error.message))
    }
});
const getList = asyncHandler(async (req, res) => {
    const user = req.user;
    if (!['admin', 'corp-admin'].includes(user.role)) {
        return res.status(403).json(new ApiError(403, null, "Unauthorized to view this resource!"));
    }
    const { page = 1, limit = 10, search } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    let userIds = [];
    if (search) {
        const users = await User.find({
            firstName: { $regex: search, $options: "i" },
            role: "corp-user"
        }).select('_id');

        userIds = users.map(user => user._id);
    }
    const query = search
        ? { userId: { $in: userIds } }
        : {};
    try {
        const packageDistributions = await PackageDistribution.find(query)
            .populate({
                path: "mainPackageId",
                populate: {
                    path: "specializationId",
                    select: "name"
                }
            })
            .populate("userId", "firstName lastName");
        if (!packageDistributions) {
            return res.status(404).json(new ApiError(404, null, "Package distribution not found"));
        }
        const totalDistObj = await PackageDistribution.countDocuments(query);
        const flattenedResponse = packageDistributions.map((item) => {
            return {
                _id: item._id,
                userId: item.userId._id,
                mainPackageId: item._id,
                userName: `${item.userId.firstName} ${item.userId.lastName}`,
                category: item.mainPackageId.specializationId.name,
                sessions: item.sesAllotted,
                usedSessions: item.used,
                isActive: item.isActive,
                createdAt: item.createdAt,
            }
        })
        return res.status(200).json(new ApiResponse(200, {
            result: flattenedResponse,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalDistObj / limitNumber),
                totalItems: totalDistObj,
                itemsPerPage: limitNumber,
            },
        }, "Allotted session retrieved successfully"));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiError(500, null, error.message))
    }
})
const deleteAllottedSessions = asyncHandler(async (req, res) => {
    const { distributionId } = req.params;

    const packageDistribution = await PackageDistribution.findById(distributionId);
    if (!packageDistribution) {
        return res.status(404).json(new ApiError(404, null, "Package distribution not found"));
    }
    if (packageDistribution.used) {
        return res.status(400).json(new ApiError(400, null, "Cannot delete used sessions."));
    }
    await PackageDistribution.findByIdAndDelete(distributionId);
    const mainPackage = await CorpPackage.findById(packageDistribution.mainPackageId);
    if (mainPackage) {
        mainPackage.remainingSessions += packageDistribution.sesAllotted;
        if (mainPackage.remainingSessions > 0) {
            mainPackage.isActive = true;
        }
        await mainPackage.save();
    }

    return res.status(200).json(new ApiResponse(200, null, "Allotted session deleted successfully"));
});
const getById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const packageData = await PackageDistribution.findById(id).populate({
            path: "mainPackageId",
            populate: {
                path: "specializationId",
                select: "name"
            }
        })
            .populate("userId", "firstName lastName");
        if (!packageData) {
            return res.status(404).json(new ApiError(404, null, "Package distribution not found"));
        }
        console.log(packageData)
        const flattenedResponse = {
            _id: packageData._id,
            userId: packageData.userId._id,
            mainPackageId: packageData._id,
            userName: `${packageData.userId.firstName} ${packageData.userId.lastName}`,
            category: packageData.mainPackageId.specializationId.name,
            sessions: packageData.sesAllotted,
            usedSessions: packageData.used,
            isActive: packageData.isActive,
            createdAt: packageData.createdAt,
        }

        return res.status(200).json(new ApiResponse(200, { result: flattenedResponse }, "Data fatched successfully"))

    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiError(500, null, error.message))
    }
})

// const getListForAdmin = asyncHandler(async (req, res) => { })

export { validate, AllotSessionsTocorpUser, editAllottedSessions, getAllottedSession, getList, deleteAllottedSessions, getById }