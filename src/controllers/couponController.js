import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse";
import { Coupon } from "../models/couponModel.js";

const createCoupon = asyncHandler(async (req, res) => {
    try {
        const { code, discountPercentage, startDate, expiryDate, usageLimit, } = req.body;
        const coupon = new Coupon.create({ code, discountPercentage, startDate, expiryDate, usageLimit })
        if (!coupon) {
            throw new ApiError(400, "failed to create coupon!");
        }
        res.status(201).json(new ApiResponse(201, coupon, "coupon created successfully!"))
    } catch (error) {
        return res.status(500).json(new ApiError(500, error.message))
    }
})
const updateCoupon = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true })
        if (!coupon) {
            throw new ApiError(404, "Coupon not found!")
        }
        res.status(200).json(new ApiResponse(200, coupon, "coupon updated successfully!"))
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiError(500, error.message))
    }
})
const deleteCoupon = asyncHandler(async (req, res) => {
    const { code, discountPercentage, startDate, expiryDate, usageLimit, } = req.body;
    const coupon = new Coupon({ code, discountPercentage, startDate, expiryDate, usageLimit })
    cou
})
const couponList = asyncHandler(async (req, res) => {
    const { code, discountPercentage, startDate, expiryDate, usageLimit, } = req.body;
    const coupon = new Coupon({ code, discountPercentage, startDate, expiryDate, usageLimit })
    cou
})
const couponById = asyncHandler(async (req, res) => {
    const { code, discountPercentage, startDate, expiryDate, usageLimit, } = req.body;
    const coupon = new Coupon({ code, discountPercentage, startDate, expiryDate, usageLimit })
    cou
})

export { createCoupon, updateCoupon, deleteCoupon, couponList, couponById }