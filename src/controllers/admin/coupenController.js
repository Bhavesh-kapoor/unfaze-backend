import { Coupon } from "../../models/couponModel.js";
import { check, validationResult } from "express-validator";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js"; // For consistent response formatting
import { Specialization } from "../../models/specilaizationModel.js";

// Validation rules for coupons
const coupenValidation = [
    check('code', 'Coupon code is required').notEmpty(),
    check('expiryDate', 'Expiry date of coupon is required').notEmpty(),
    check('usageLimit', 'Limit of coupon is required').notEmpty().isInt({ min: 1 }),
    check('specializationId', 'Specialization ID must be a valid MongoDB ObjectId').notEmpty().isMongoId(),
];

// Store (Create) Coupon API
const create = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json(new ApiError(400, "", errors.array()));
    }
    const specialization = await Specialization.findById(req.body.specializationId);
    if (!specialization) {
        return res.status(404).json(new ApiError(404, null, "Specialization not found."));
    }
    const now = new Date();
    const expiry = new Date(req.body.expiryDate);
    if (expiry <= now) {
        return res.status(400).json(new ApiError(400, null, "Expiry date must be later than today date."));
    }

    try {
        const couponExist = await Coupon.findOne({ code: req.body.code.toUpperCase() });
        if (couponExist) {
            return res.status(409).json(new ApiError(409, "", "Coupon code already exists!"));
        }
        const newCoupon = new Coupon(req.body);
        await newCoupon.save();
        res.status(201).json(new ApiResponse(201, newCoupon, "Coupon has been created!"));
    } catch (error) {
        console.log(error)
        res.status(500).json(new ApiError(500, "somthing went wrong while creating coupon", error.message,))
    }
});

// List Coupons API
// List Coupons API (with only Specialization name)
const list = asyncHandler(async (req, res) => {
    const coupons = await Coupon.find()
        .populate('specializationId', 'name');  // Only fetch the 'name' field from Specialization

    if (!coupons.length) {
        return res.status(404).json(new ApiError(404, "No coupons found!"));
    }

    res.status(200).json(new ApiResponse(200, coupons, "Coupons retrieved successfully!"));
});

// Edit (Retrieve Coupon by ID) API (with only Specialization name)
const edit = asyncHandler(async (req, res) => {
    const couponId = req.params.id;
    const coupon = await Coupon.findById(couponId)
        .populate('specializationId', 'name');  // Only fetch the 'name' field from Specialization

    if (!coupon) {
        return res.status(404).json(new ApiError(404, "Coupon not found!"));
    }

    res.status(200).json(new ApiResponse(200, coupon, "Coupon details retrieved successfully!"));
});


// Update Coupon API
const update = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json(new ApiError(400, "", errors.array()));
    }

    const couponId = req.params.id;
    const { code, discountPercentage, startDate, expiryDate, usageLimit, specializationId } = req.body;

    const now = new Date();
    const start = new Date(startDate);
    const expiry = new Date(expiryDate);

    if (start < now) {
        return res.status(400).json(new ApiError(400, "Start date must be today or a future date."));
    }

    if (expiry <= start) {
        return res.status(400).json(new ApiError(400, "Expiry date must be later than start date."));
    }

    const couponExist = await Coupon.findOne({ 'code': code, '_id': { $ne: couponId } });
    if (couponExist) {
        return res.status(409).json(new ApiError(409, "Coupon code already exists!"));
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
        couponId,
        {
            code,
            discountPercentage,
            startDate: start,
            expiryDate: expiry,
            usageLimit,
            specializationId
        },
        { new: true }  // Return the updated coupon
    );

    if (!updatedCoupon) {
        return res.status(404).json(new ApiError(404, "Coupon not found!"));
    }

    res.status(200).json(new ApiResponse(200, updatedCoupon, "Coupon updated successfully!"));
});
const deleteCoupon = asyncHandler(async (req, res) => {
    const couponId = req.params.id;

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
        return res.status(404).json(new ApiError(404, "Coupon not found!"));
    }

    await coupon.remove(); // Remove the coupon from the database

    res.status(200).json(new ApiResponse(200, null, "Coupon has been deleted successfully!"));
});

// Export the APIs
export { coupenValidation, create, list, edit, update, deleteCoupon };
