import Blog from "../../models/blogsModel.js";
import { check, validationResult } from "express-validator";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import mongoose from "mongoose";
import { convertPathToUrl } from "./TherepistController.js";

const validateBlogs = [
  check("title", "Blog title is required!").notEmpty(),
  check("description", "Blog Description is required!").notEmpty(),
  check("categoryId", "CategoryId  is required!").notEmpty(),
];

const getAllBlogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortkey = "createdAt",
    sortdir = "desc",
    title,
    category,
  } = req.query;
  const matchConditions = {};
  if (title) {
    matchConditions.title = { $regex: title, $options: "i" };
  }

  const aggregatePipeline = [
    { $match: matchConditions },
    {
      $lookup: {
        from: "categories",
        as: "category",
        localField: "categoryId",
        foreignField: "_id",
        pipeline: [{ $project: { name: 1 } }],
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    { $addFields: { category: "$category.name" } },
    { $sort: { [sortkey]: sortdir === "desc" ? -1 : 1 } },
    { $skip: (page - 1) * limit },
    { $limit: parseInt(limit) },
  ];

  if (category) {
    aggregatePipeline.splice(4, 0, {
      $match: { category: { $regex: category, $options: "i" } },
    });
  }

  try {
    const getall = await Blog.aggregate(aggregatePipeline);
    const totalBlogs = await Blog.countDocuments(matchConditions); // Count total blogs that match the conditions
    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalBlogs / limit),
      totalItems: totalBlogs,
      itemsPerPage: parseInt(limit),
    };

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { pagination, result: getall },
          "Blog Data Fetch Successfully!"
        )
      );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const createBlog = asyncHandler(async (req, res) => {
  const { title, description, isActive, categoryId, short_description } =
    req.body;
  const BlogData = {
    title,
    isActive,
    categoryId,
    description,
    short_description,
  };

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json(new ApiError(400, "", "Invalid Category id"));
  } else {
    if (req.file && req.file.path) {
      BlogData.imageUrl = convertPathToUrl(req.file.path);
    }
    // now save the data
    const createdBlog = await Blog.create(BlogData);
    res
      .status(200)
      .json(new ApiResponse(200, createdBlog, "Blogs created Successfully!"));
  }
});

const updateBlog = asyncHandler(async (req, res) => {
  const blogId = req.params._id;
  const { title, description, categoryId, isActive, short_description } =
    req.body;
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json(new ApiError(400, "", "Invalid Category id"));
  }
  const blog = await Blog.findOne({ _id: blogId });
  if (!blog) {
    return res.status(404).json(new ApiError(404, "", "Blog not found!"));
  }

  if (req.file && req.file.path) {
    blog.imageUrl = convertPathToUrl(req.file.path);
  }
  blog.title = title;
  blog.isActive = isActive;
  blog.categoryId = categoryId;
  blog.description = description;
  blog.short_description = short_description;
  blog.save();
  return res
    .status(201)
    .json(new ApiResponse(201, blog, "blog updatated successfully!"));
});

const deleteBolg = asyncHandler(async (req, res) => {
  const blogId = req.params._id;
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return res.status(400).json(new ApiError(400, "", "Invalid BlogId id"));
  }
  const deletedBlog = await Blog.findByIdAndDelete(blogId);
  if (!deletedBlog) {
    return res
      .status(200)
      .json(new ApiError(404, "", "error while deleting the Blog"));
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "", "Blog deleted successfully!"));
});

const findBolgById = asyncHandler(async (req, res) => {
  const blogId = req.params._id;
  const blog = await Blog.findById(blogId);
  return res
    .status(200)
    .json(new ApiResponse(200, blog, "Blog fetched succsessfully!"));
});
export {
  validateBlogs,
  createBlog,
  getAllBlogs,
  updateBlog,
  deleteBolg,
  findBolgById,
};
