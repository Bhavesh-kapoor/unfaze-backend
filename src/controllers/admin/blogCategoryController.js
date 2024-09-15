import mongoose from "mongoose";
import ApiError from "../../utils/ApiError.js";
import Category from "../../models/categoryModel.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

// Fetch all blog categories
const allBlogCategory = asyncHandler(async (req, res) => {
  try {
    const getAllCategory = await Category.find().sort({ _id: -1 });
    if (!getAllCategory || getAllCategory.length === 0) {
      return res
        .status(404)
        .json(new ApiError(404, "", "No categories found!"));
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, getAllCategory, "Categories fetched successfully!")
      );
  } catch (error) {
    res
      .status(500)
      .json(new ApiError(500, "", "Server error while fetching categories"));
  }
});

// Create a new blog category
const createBlogCategory = asyncHandler(async (req, res) => {
  let { name, type, isActive, description } = req.body;

  if (!name || !type) {
    return res
      .status(400)
      .json(new ApiError(400, "", "Blog Category Name & Type is required"));
  }

  try {
    name = name.toLowerCase().trim();
    const existingCategory = await Category.findOne({ name });

    if (existingCategory) {
      return res
        .status(409)
        .json(new ApiError(409, "", "Category already exists!"));
    }

    const category = await Category.create({
      name,
      type,
      isActive,
      description,
    });
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          category,
          "Blog Category has been created successfully!"
        )
      );
  } catch (error) {
    res
      .status(500)
      .json(new ApiError(500, "", "Server error while creating category"));
  }
});

// Update an existing blog category
const updateBlogCategory = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  let { name } = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json(new ApiError(400, "", "Invalid category ID"));
  }

  if (!name || name.trim().length === 0) {
    return res
      .status(400)
      .json(new ApiError(400, "", "Category name is required!"));
  }

  try {
    name = name.toLowerCase().trim();
    const category = await Category.findByIdAndUpdate(
      _id,
      { name },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res
        .status(404)
        .json(new ApiError(404, "", "Error while updating the category"));
    }

    res
      .status(200)
      .json(new ApiResponse(200, category, "Category updated successfully!"));
  } catch (error) {
    res
      .status(500)
      .json(new ApiError(500, "", "Server error while updating category"));
  }
});

// Delete a blog category
const deleteBlogCategory = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json(new ApiError(400, "", "Invalid category ID"));
  }

  try {
    const deletedBlogCategory = await Category.findByIdAndDelete(_id);

    if (!deletedBlogCategory) {
      return res.status(404).json(new ApiError(404, "", "Category not found!"));
    }

    res
      .status(200)
      .json(new ApiResponse(200, "", "Blog category deleted successfully"));
  } catch (error) {
    res
      .status(500)
      .json(new ApiError(500, "", "Server error while deleting category"));
  }
});

export {
  createBlogCategory,
  allBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
};
