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
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', title, category } = req.query;
    const matchConditions = {};
    if (title) {
        matchConditions.title = { $regex: title, $options: 'i' }; 
    }

    const aggregatePipeline = [
        {
            $match: matchConditions 
        },
        {
            $lookup: {
                from: 'categories',
                as: 'category',
                localField: 'categoryId',
                foreignField: '_id'
            }
        },
        {
            $unwind: { path: "$category", preserveNullAndEmptyArrays: true }
        },
        {
            $addFields: {
              category: "$category.categoryname",
            },
        },
        {
            $project: {
                title: 1,
                description: 1,
                blogImage: 1,
                createdAt: 1,
                category: 1
            }
        },
        {
            $sort: { [sort]: order === 'desc' ? -1 : 1 }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: parseInt(limit)
        }
    ];

    // Apply category filtering if the category is provided
    if (category) {
        aggregatePipeline.splice(4, 0, {
            $match: { "category": { $regex: category, $options: 'i' } }
        });
    }

    try {
        const getall = await Blog.aggregate(aggregatePipeline);
        const totalBlogs = await Blog.countDocuments(matchConditions); // Count total blogs that match the conditions
        const pagination = {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalBlogs / limit),
            totalBlogs,
            itemsPerPage: parseInt(limit),
        };

        res.status(200).json(new ApiResponse(200, { blogs: getall, pagination }, "Blog Data Fetch Successfully!"));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});




const createBlog = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(new ApiError(400, "Validation Error", errors.array()));
    } else {
        const { title, description, categoryId } = req.body;
        const BlogData = { title, description, categoryId };
       
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
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