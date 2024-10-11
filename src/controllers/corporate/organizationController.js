import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { Organization } from "../../models/corporate/organizationModel.js";
import { isValidObjectId } from "../../utils/mongooseUtility.js";
import { json } from "express";


// Register a new organization
const register = asyncHandler(async (req, res) => {
    try {
        const { name, type } = req.body;
        if (!name || !type) {
            return res.status(400).json(new ApiError(400, 'Organization Name and Type are required'));
        }
        const formattedName = name.trim().toLowerCase();
        const existingOrg = await Organization.findOne({ name: formattedName });
        if (existingOrg) {
            return res.status(400).json(new ApiError(400, null, 'Organization with this name already exists'));
        }

        const organization = new Organization({ name: formattedName, type });
        await organization.save();
        return res.status(201).json(new ApiResponse(201, organization, 'Organization registered successfully'));
    } catch (error) {
        console.log(error);
        throw new ApiError(401, error?.message || "something went wrong")
    }
});

// Update an organization
const update = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type } = req.body;
        if (!isValidObjectId(id)) {
            return res.status(400).json(new ApiError(400, null, 'Invalid organization ID'));
        }
        if (!name || !type) {
            return res.status(400).json(new ApiError(400, null, 'Organization Name and Type are required'));
        }
        const updatedOrg = await Organization.findByIdAndUpdate(
            id,
            { name, type },
            { new: true, runValidators: true }
        );
        if (!updatedOrg) {
            return res.status(404).json(new ApiError(404, null, 'Organization not found'));
        }
        return res.status(200).json(new ApiResponse(200, updatedOrg, 'Organization updated successfully'));
    } catch (error) {
        console.log(error);
        return res.status(200).json(new ApiError(401, error?.message || "something went wrong"))
    }
});

// Get organization by ID
const getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        throw new ApiError(400, 'Invalid organization ID');
    }
    const organization = await Organization.findById(id);
    if (!organization) {
        throw new ApiError(404, 'Organization not found');
    }

    return res.status(200).json(new ApiResponse(200, organization, 'Organization retrieved successfully'));
});

// Get all organizations
const getAll = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const query = search
        ? { name: { $regex: search, $options: 'i' } }
        : {};

    const organizations = await Organization.find(query)
        .skip(skip)
        .limit(limitNumber);

    const totalOrganizations = await Organization.countDocuments(query);

    return res.status(200).json(new ApiResponse(200, {
        result: organizations,
        pagination: {
            totalPages: Math.ceil(totalOrganizations / limitNumber),
            currentPage: pageNumber,
            totalItems: totalOrganizations,
            itemsPerPage: limitNumber,
        },
    }, 'Organizations retrieved successfully'));
});

// Delete organization by ID
const deleteById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        throw new ApiError(400, 'Invalid organization ID');
    }
    const organization = await Organization.findByIdAndDelete(id);
    if (!organization) {
        throw new ApiError(404, 'Organization not found');
    }
    return res.status(200).json(new ApiResponse(200, null, 'Organization deleted successfully'));
});

export { register, update, getById, getAll, deleteById };
