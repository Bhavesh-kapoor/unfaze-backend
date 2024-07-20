import Blog from "../../models/blogsModel.js";
import { check, validationResult } from "express-validator";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import mongoose from "mongoose";

const validateBlogs = [
    check('title', "Blog title is required!").notEmpty(),
    check('description', "Blog Description is required!").notEmpty(),
    check('categoryId', "CategoryId  is required!").notEmpty(),
]


const getAllBlogs = asyncHandler(async (req, res) => {

    const aggregatePipeline = [
        {
            $lookup: {
                from: 'categories',
                as: 'category',
                localField: 'categoryId',
                foreignField: '_id'
            }
        },
        {
            $project: {
                title: 1,
                description: 1,
                blogImage: 1,
                createdAt  : 1,
                "category.categoryname": 1
            }
        }
    ]
    const getall = await Blog.aggregate(aggregatePipeline);
    res.status(200).json(new ApiResponse(200, getall, "Blog Data Fetch Successfully!"));

});

const createBlog = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(new ApiError(400, "Validation Error", errors.array()));
    } else {
        const { title, description, categoryId } = req.body;
        const BlogData = { title, description, categoryId };
        BlogData.userId = req.user._id;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json(new ApiError(400, "", "Invalid User id"));
        } else if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json(new ApiError(400, "", "Invalid Category id"));
        } else {
            if (req.file && req.file.path) {
                BlogData.blogImage = req.file.path;
            }
            // now save the data
            await Blog.create(BlogData);
            res.status(200).json(new ApiResponse(200, "", "Blogs created Successfully!"));

        }
    }
});

export { validateBlogs, createBlog, getAllBlogs };