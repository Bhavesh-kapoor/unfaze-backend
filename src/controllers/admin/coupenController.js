import { Coupon } from "../../models/couponModel.js";
import { check, validationResult } from "express-validator";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js"; // For consistent response formatting
import { Specialization } from "../../models/specilaizationModel.js";
import { Course } from "../../models/courseModel.js";



// Validation rules for coupons
const coupenValidation = [
    check('code', 'Coupon code is required').notEmpty(),
    check('expiryDate', 'Expiry date of coupon is required').notEmpty(),
    check('usageLimit', 'Limit of coupon is required').notEmpty().isInt({ min: 1 }),
    check('specializationId', 'Specialization ID must be a valid MongoDB ObjectId').notEmpty().isMongoId(),
    check('discription', 'Discription is required').notEmpty()
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
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const totalCoupons = await Coupon.countDocuments();

    // Fetch the paginated coupons
    const coupons = await Coupon.find()
        .populate('specializationId', 'name')
        .skip(skip)
        .limit(limitNumber);

    if (!coupons.length) {
        return res.status(404).json(new ApiError(404, "No coupons found!"));
    }

    // Return the paginated coupons with total count
    res.status(200).json(
        new ApiResponse(200, {
            result: coupons,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalCoupons / limitNumber),
                totalItems: totalCoupons,
                itemsPerPage: limitNumber,
            }
        }, "Coupons retrieved successfully!")
    );
});


// Edit (Retrieve Coupon by ID) API (with only Specialization name)
const edit = asyncHandler(async (req, res) => {
    const couponId = req.params.id;
    const coupon = await Coupon.findById(couponId)
        .populate('specializationId', 'name');

    if (!coupon) {
        return res.status(404).json(new ApiError(404, "Coupon not found!"));
    }

    res.status(200).json(new ApiResponse(200, coupon, "Coupon details retrieved successfully!"));
});


// Update Coupon API
const update = asyncHandler(async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json(new ApiError(400, "", errors.array()));
        }

        const couponId = req.params.id;
        const now = new Date();
        const start = new Date(req.body.startDate);
        const expiry = new Date(req.body.expiryDate);

        if (start < now) {
            return res.status(400).json(new ApiError(400, "Start date must be today or a future date."));
        }

        if (expiry <= start) {
            return res.status(400).json(new ApiError(400, "Expiry date must be later than start date."));
        }

        const couponExist = await Coupon.findOne({ code: req.body.code, '_id': { $ne: couponId } });
        if (couponExist) {
            return res.status(409).json(new ApiError(409, "Coupon code already exists try another one!"));
        }
        const updatedCoupon = await Coupon.findByIdAndUpdate(
            couponId,
            req.body,
            { new: true }  // Return the updated coupon
        );
        if (!updatedCoupon) {
            return res.status(404).json(new ApiError(404, "Coupon not found!"));
        }

        res.status(200).json(new ApiResponse(200, updatedCoupon, "Coupon updated successfully!"));
    } catch (error) {
        console.log(error)
        return res.status(500).json(new ApiError(500, "Something went wrong in update coupon", error.message));
    }
});
const deleteCoupon = asyncHandler(async (req, res) => {
    const couponId = req.params.id;

    const coupon = await Coupon.findByIdAndDelete(couponId);

    if (!coupon) {
        return res.status(404).json(new ApiError(404, "Coupon not found!"));
    }
    res.status(200).json(new ApiResponse(200, null, "Coupon has been deleted successfully!"));
});
// 
const calculateDiscountedAmount = (price, coupon) => {
    let discount, amountToPay;
    if (coupon.type === "percentage") {
        discount = price * (coupon.discountPercentage / 100);
        discount = Math.round(discount * 100) / 100;
        amountToPay = price - discount;
    } else {
        discount = coupon.fixDiscount;
        amountToPay = price - discount;
    }
    return { discount, amountToPay };
};

const validateSpecializationCoupon = async (specialization_id, coupon, currencyType) => {
    const specialization = await Specialization.findById(specialization_id);
    if (!specialization) {
        throw new ApiError(404, "Specialization not found");
    }

    if (!coupon.specializationId.equals(specialization._id)) {
        throw new ApiError(400, "This coupon is not valid for this category");
    }

    const price = currencyType === "INR" ? specialization.inrPrice : specialization.usdPrice;
    const { discount, amountToPay } = calculateDiscountedAmount(price, coupon);

    return { price, discount, amountToPay };
};

const validateCourseCoupon = async (course_id, coupon, currencyType) => {
    const course = await Course.findById(course_id);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    if (!coupon.specializationId.equals(course.specializationId)) {
        throw new ApiError(400, "This coupon is not valid for this category");
    }

    const price = currencyType === "INR" ? course.inrPrice : course.usdPrice;
    const { discount, amountToPay } = calculateDiscountedAmount(price, coupon);

    return { price, discount, amountToPay };
};

const validateCoupon = asyncHandler(async (req, res) => {
    const { specialization_id, course_id, coupon_code, currencyType } = req.body;

    try {
        const coupon = await Coupon.findOne({ code: coupon_code });
        if (!coupon || coupon.expiryDate < new Date() || !coupon.isActive) {
            throw new ApiError(200, "Coupon not found or expired");
        }

        if (coupon.currencyType !== currencyType) {
            throw new ApiError(200, "Coupon not found or expired");
        }

        let price, discount, amountToPay;

        if (specialization_id) {
            ({ price, discount, amountToPay } = await validateSpecializationCoupon(specialization_id, coupon, currencyType));
        } else if (course_id) {
            ({ price, discount, amountToPay } = await validateCourseCoupon(course_id, coupon, currencyType));
        } else {
            return res.status(400).json(new ApiError(400, "Specialization or Course ID is required"));
        }

        return res.status(200).json(new ApiResponse(200, { totalAmount: price, finalAmount: (amountToPay), coupon_code, discount }, "Coupon applied successfully"));

    } catch (error) {
        console.error("Error validating coupon:", error);
        return res.status(500).json(new ApiError(500, "Something went wrong", error.message));
    }
});

const coupon = asyncHandler(async (req, res) => {
    try {
        const coupons = await Coupon.find({ isActive: true }).select("code discription").sort({ createdAt: -1 })
        if (!coupons) {
            return res.status(200).json(new ApiResponse(200, null, "No active coupons found!"));
        }
        return res.status(200).json(new ApiResponse(200, coupons[0], "coupon fatched successfully!"));
    } catch (error) {
        console.log(error)
        return res.status(500).json(new ApiError(500, "Something went wrong while fetching coupons", error.message));
    }
})

// Export the APIs
export { coupenValidation, create, list, edit, update, deleteCoupon, validateCoupon, coupon };
