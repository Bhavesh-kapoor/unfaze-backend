import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { Organization } from "../../models/corporate/organizationModel.js";
import { isValidObjectId } from "../../utils/mongooseUtility.js";



// Register a new organization
const register = asyncHandler(async (req, res) => {
    try {
        const { name, industry, email, phone, address, website } = req.body;

        if (!name || !industry || !email || !phone || !address) {
            return res.status(400).json(new ApiError(400, 'Name, Industry, Email, Phone, and Address are required'));
        }

        const formattedName = name.trim().toLowerCase();
        const existingOrg = await Organization.findOne({ name: formattedName });
        if (existingOrg) {
            return res.status(400).json(new ApiError(400, null, 'Organization with this name already exists'));
        }

        const organization = new Organization({
            name: formattedName,
            industry,
            email,
            phone,
            address,
            website
        });
        await organization.save();

        return res.status(201).json(new ApiResponse(201, organization, 'Organization registered successfully'));
    } catch (error) {
        console.log(error);
        return res.status(500).send(new ApiError(500, null, error.message));
    }
});

const update = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { name, industry, email, phone, address, website, isActive } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json(new ApiError(400, null, 'Invalid organization ID'));
        }

        const organization = await Organization.findById(id);
        if (!organization) {
            return res.status(404).json(new ApiError(404, null, 'Organization not found'));
        }

        if (name) organization.name = name.trim().toLowerCase();
        if (industry) organization.industry = industry;
        if (email) organization.email = email;
        if (phone) organization.phone = phone;
        if (website) organization.website = website;
        if (isActive !== undefined) organization.isActive = isActive;

        if (address) {
            organization.address = {
                ...organization.address,
                ...address,
            };
        }

        const updatedOrg = await organization.save();

        return res.status(200).json(new ApiResponse(200, updatedOrg, 'Organization updated successfully'));
    } catch (error) {
        console.error(error);
        return res.status(500).send(new ApiError(500, null, error.message));
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

const list = asyncHandler(async (req, res) => {
    try {
        const organizations = await Organization.find().select("name");
        return res.status(200).json(new ApiResponse(200, { list: organizations }, "List fatched successfully"));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiError(500, "somthing went wrong", error.message));
    }
})

export { register, update, getById, getAll, deleteById, list };
